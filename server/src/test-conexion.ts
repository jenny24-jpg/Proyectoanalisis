import db from './config/database.js'; // Importamos el export default de tu archivo

async function probarConexion() {
  try {
    console.log('⏳ Iniciando prueba de conexión con Oracle en Docker...');
    
    // 1. Inicializamos el Pool
    await db.initializePool();

    // 2. Ejecutamos el Health Check que ya tenías programado
    const estado = await db.checkDatabaseHealth();

    if (estado.isHealthy) {
      console.log('\n✅ ¡ÉXITO! Conexión establecida correctamente.');
      console.log(`⏱️ Latencia: ${estado.latencyMs}ms`);
      console.log(`📅 Hora en Oracle: ${estado.serverTime}`);
    } else {
      console.log('\n❌ Falló la conexión (Health Check negativo).');
      console.error('Detalle:', estado.error);
    }

  } catch (error) {
    console.error('\n💥 Error crítico durante la prueba:', error);
  } finally {
    // 3. Cerramos el pool para que el script termine correctamente
    await db.closePool(2);
  }
}

probarConexion();