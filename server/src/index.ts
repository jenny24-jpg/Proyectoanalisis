import express from 'express';
import { config } from './config/index.js';
import { initializePool, closePool, checkDatabaseHealth } from './config/database.js';

const app = express();
const PORT = config.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de salud básica y estado de la base de datos (Health Check)
app.get('/health', async (_req, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.status(dbHealth.isHealthy ? 200 : 503).json({
    status: dbHealth.isHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date(),
    environment: config.nodeEnv,
    database: dbHealth,
  });
});

// Registro de módulos del sistema
// TODO: Importar y usar rutas de compras, bancos, cxp, cxc

const server = app.listen(PORT, async () => {
  console.log(`[ERP Server]: API base corriendo en http://localhost:${PORT}`);
  console.log(`[ERP Server]: Entorno: ${config.nodeEnv}`);

  // Intento de inicialización del pool al arrancar (opcional / no bloqueante en desarrollo sin .env)
  try {
    if (config.oracle.user && config.oracle.password && config.oracle.connectString) {
      await initializePool();
    } else {
      console.warn('[ERP Server]: Variables de conexión a Oracle no configuradas aún en .env. El pool se inicializará bajo demanda.');
    }
  } catch (error) {
    console.error('[ERP Server]: Advertencia al inicializar el pool de Oracle en arranque:', error);
  }
});

// Manejo de apagado controlado (Graceful Shutdown)
const handleGracefulShutdown = async (signal: string) => {
  console.log(`\n[ERP Server]: Señal ${signal} recibida. Cerrando servidor y conexiones...`);
  server.close(async () => {
    console.log('[ERP Server]: Servidor HTTP cerrado.');
    try {
      await closePool(5);
    } catch (err) {
      console.error('[ERP Server]: Error al cerrar el pool de conexiones:', err);
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

