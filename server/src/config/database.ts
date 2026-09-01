import oracledb from 'oracledb';
import { config } from './index.js';

// ==============================================================================
// CONFIGURACIÓN GLOBAL DE ORACLEDB (THIN MODE POR DEFECTO)
// ==============================================================================
// Configuración para que las consultas devuelvan objetos con los nombres de columnas
// en lugar de arrays indexados numéricamente.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Opcional: Tratar CLOBs automáticamente como Strings para facilitar su manejo
oracledb.fetchAsString = [oracledb.CLOB];

// Control de transacciones explícito por defecto para garantizar integridad ACID en el ERP
oracledb.autoCommit = false;

// Referencia en memoria al Pool principal de conexiones
let pool: oracledb.Pool | null = null;

/**
 * Valida que las variables de entorno mínimas requeridas estén presentes.
 * @throws {Error} Si falta alguna variable obligatoria
 */
function validateDatabaseEnvironment(): void {
  const { user, password, connectString } = config.oracle;
  const missingVariables: string[] = [];

  if (!user) missingVariables.push('DB_USER (o NODE_ORACLEDB_USER)');
  if (!password) missingVariables.push('DB_PASSWORD (o NODE_ORACLEDB_PASSWORD)');
  if (!connectString) missingVariables.push('DB_CONNECTION_STRING (o NODE_ORACLEDB_CONNECTIONSTRING)');

  if (missingVariables.length > 0) {
    const errorMsg = `[Oracle DB Config Error]: Faltan variables de entorno requeridas para la conexión a Oracle Database:\n` +
      missingVariables.map((v) => `  - ${v}`).join('\n') +
      `\nPor favor, crea un archivo '.env' en la carpeta 'server/' basándote en '.env.example'.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Inicializa el Pool de conexiones a Oracle Database de forma centralizada y segura.
 * Implementa el patrón Singleton para evitar la creación duplicada del pool.
 * 
 * @returns {Promise<oracledb.Pool>} Instancia del Pool de conexiones activo
 */
export async function initializePool(): Promise<oracledb.Pool> {
  if (pool) {
    return pool;
  }

  validateDatabaseEnvironment();

  const { user, password, connectString, poolMin, poolMax, poolIncrement, poolTimeout, poolAlias } = config.oracle;

  try {
    console.log(`[Oracle DB]: Inicializando Connection Pool '${poolAlias}'...`);
    console.log(`[Oracle DB]: Conectando a host/servicio: ${connectString} con usuario: ${user}`);

    pool = await oracledb.createPool({
      user,
      password,
      connectString,
      poolMin,
      poolMax,
      poolIncrement,
      poolTimeout,
      poolAlias,
    });

    console.log(`[Oracle DB]: Pool de conexiones '${poolAlias}' inicializado exitosamente (Min: ${poolMin}, Max: ${poolMax}).`);
    return pool;
  } catch (error) {
    console.error('[Oracle DB Error]: Fallo crítico al inicializar el Pool de conexiones Oracle:', error);
    throw error;
  }
}

/**
 * Obtiene el Pool de conexiones activo. Si aún no está inicializado, lo inicializa.
 * 
 * @returns {Promise<oracledb.Pool>} Pool de conexiones
 */
export async function getPool(): Promise<oracledb.Pool> {
  if (!pool) {
    return initializePool();
  }
  return pool;
}

/**
 * Obtiene una conexión activa directamente desde el Pool.
 * 
 * IMPORTANTE: Es responsabilidad del consumidor invocar 'await connection.close()'
 * cuando finalice de usar la conexión para regresarla al pool.
 * 
 * @returns {Promise<oracledb.Connection>} Conexión de Oracle
 */
export async function getConnection(): Promise<oracledb.Connection> {
  try {
    const activePool = await getPool();
    const connection = await activePool.getConnection();
    return connection;
  } catch (error) {
    console.error('[Oracle DB Error]: Error al obtener una conexión del pool:', error);
    throw error;
  }
}

/**
 * Helper genérico para ejecutar una consulta SQL / PLSQL de forma segura.
 * Gestiona automáticamente el ciclo de vida de la conexión (adquisición y liberación al pool).
 * 
 * @template T Tipo de los registros esperados en rows
 * @param {string} sql Sentencia SQL o bloque PL/SQL a ejecutar
 * @param {oracledb.BindParameters} [binds=[]] Parámetros bind posicionales o por nombre
 * @param {oracledb.ExecuteOptions} [options={}] Opciones adicionales de ejecución de oracledb
 * @returns {Promise<oracledb.Result<T>>} Resultado de la ejecución
 * 
 * @example
 * const result = await execute<Proveedor>('SELECT * FROM PROVEEDORES WHERE ID = :id', { id: 101 });
 * console.log(result.rows);
 */
export async function execute<T = Record<string, unknown>>(
  sql: string,
  binds: oracledb.BindParameters = {},
  options: oracledb.ExecuteOptions = {}
): Promise<oracledb.Result<T>> {
  let connection: oracledb.Connection | null = null;
  try {
    connection = await getConnection();
    const result = await connection.execute<T>(sql, binds, options);
    return result;
  } catch (error) {
    console.error('[Oracle DB Error]: Error ejecutando sentencia SQL:', {
      sql,
      binds: typeof binds === 'object' ? JSON.stringify(binds) : binds,
      error,
    });
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('[Oracle DB Error]: Error al liberar la conexión al pool:', closeError);
      }
    }
  }
}

/**
 * Helper para ejecutar operaciones dentro de una transacción ACID garantizada.
 * Si la función de callback se resuelve con éxito, realiza COMMIT automático.
 * Si ocurre un error, realiza ROLLBACK automático y propaga la excepción.
 * Siempre libera la conexión al pool al finalizar.
 * 
 * @template T Tipo de retorno esperado
 * @param {(connection: oracledb.Connection) => Promise<T>} work Función con la lógica de negocio a ejecutar
 * @returns {Promise<T>} Resultado de la función ejecutada
 * 
 * @example
 * const ordenCreada = await withTransaction(async (conn) => {
 *   await conn.execute('INSERT INTO ORDENES_COMPRA ...', [ ... ]);
 *   await conn.execute('INSERT INTO DETALLES_ORDEN ...', [ ... ]);
 *   return { id: 1, status: 'CREATED' };
 * });
 */
export async function withTransaction<T>(
  work: (connection: oracledb.Connection) => Promise<T>
): Promise<T> {
  let connection: oracledb.Connection | null = null;
  try {
    connection = await getConnection();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        console.warn('[Oracle DB Transaction]: Rollback ejecutado debido a un error en la transacción.');
      } catch (rollbackError) {
        console.error('[Oracle DB Error]: Error crítico al ejecutar Rollback:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('[Oracle DB Error]: Error al liberar la conexión transaccional al pool:', closeError);
      }
    }
  }
}

/**
 * Verifica la conectividad con la base de datos Oracle ejecutando una consulta de prueba.
 * Útil para el endpoint de Health Check o el inicio del servidor.
 * 
 * @returns {Promise<{ isHealthy: boolean; latencyMs: number; timestamp?: Date; error?: string }>}
 */
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  latencyMs: number;
  serverTime?: Date;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const result = await execute<{ HEALTH_CHECK: number; SERVER_TIME: Date }>(
      'SELECT 1 AS HEALTH_CHECK, SYSDATE AS SERVER_TIME FROM DUAL'
    );
    const latencyMs = Date.now() - startTime;
    const firstRow = result.rows && result.rows[0];

    return {
      isHealthy: true,
      latencyMs,
      serverTime: firstRow ? firstRow.SERVER_TIME : new Date(),
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      isHealthy: false,
      latencyMs,
      error: errorMessage,
    };
  }
}

/**
 * Cierra de forma limpia el pool de conexiones de Oracle (Graceful Shutdown).
 * 
 * @param {number} [drainTime=10] Tiempo en segundos para esperar a que terminen las transacciones activas
 */
export async function closePool(drainTime: number = 10): Promise<void> {
  if (!pool) {
    return;
  }

  try {
    console.log(`[Oracle DB]: Cerrando Pool de conexiones (drainTime: ${drainTime}s)...`);
    await pool.close(drainTime);
    pool = null;
    console.log('[Oracle DB]: Pool de conexiones cerrado correctamente.');
  } catch (error) {
    console.error('[Oracle DB Error]: Error al cerrar el pool de conexiones:', error);
    throw error;
  }
}

export default {
  initializePool,
  getPool,
  getConnection,
  execute,
  withTransaction,
  checkDatabaseHealth,
  closePool,
};
