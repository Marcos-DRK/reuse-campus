// Conexión a SQL Server (LocalDB) usando el paquete mssql con el driver msnodesqlv8 (autenticación de Windows).
require('dotenv').config({ quiet: true });
const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString:
    process.env.DB_CONNECTION_STRING ||
    'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=ReUseCampusDB;Trusted_Connection=yes;'
};

// Pool único compartido por toda la aplicación (similar a mysql.createPool de la Actividad 6).
let poolPromise = null;

// Devuelve el pool listo para crear consultas: (await getPool()).request()
function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        console.log('Conectado a SQL Server (ReUseCampusDB)');
        return pool;
      })
      .catch((error) => {
        poolPromise = null; // permite reintentar en la siguiente petición
        console.error('No fue posible conectar a SQL Server:', error.message);
        throw error;
      });
  }
  return poolPromise;
}

// Cierra el pool (lo usan las pruebas al terminar)
async function cerrarPool() {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
  }
}

module.exports = { sql, getPool, cerrarPool };
