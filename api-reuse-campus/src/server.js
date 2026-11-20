require('dotenv').config({ quiet: true });
const app = require('./app');
const { getPool } = require('./db');

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`API ReUse Campus ejecutándose en http://localhost:${PORT}`);
  // Se conecta a la BD al iniciar para detectar problemas de conexión de inmediato
  getPool().catch(() => console.error('Revise que SQL Server LocalDB esté activo y que exista ReUseCampusDB'));
});
