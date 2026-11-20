const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../db');
const { ErrorApp } = require('./errores');

const JWT_SECRET = process.env.JWT_SECRET || 'reuse-campus-secreto-desarrollo';

// Genera el token que Angular guarda y envía en cada petición
function generarToken(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '8h' });
}

// RN01 / RN18: verifica que la petición venga de un usuario autenticado.
// Lee el encabezado "Authorization: Bearer <token>", valida el token y vuelve a leer
// el usuario desde la BD (así un usuario desactivado o con rol cambiado no conserva permisos).
async function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');

  if (tipo !== 'Bearer' || !token) {
    throw new ErrorApp(401, 'Debe iniciar sesión para realizar esta operación');
  }

  let datos;
  try {
    datos = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new ErrorApp(401, 'Sesión inválida o expirada. Inicie sesión nuevamente');
  }

  const pool = await getPool();
  const resultado = await pool
    .request()
    .input('id', sql.Int, datos.id)
    .query('SELECT id, nombre, correo, rol, estado FROM Usuarios WHERE id = @id');

  const usuario = resultado.recordset[0];
  if (!usuario) {
    throw new ErrorApp(401, 'El usuario de la sesión ya no existe');
  }
  if (usuario.estado !== 'ACTIVO') {
    throw new ErrorApp(403, 'Su cuenta está inactiva. Contacte al administrador');
  }

  req.usuario = usuario; // { id, nombre, correo, rol, estado }
  next();
}

// Control de acceso por rol: solo administradores
function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'ADMIN') {
    throw new ErrorApp(403, 'Solo un administrador puede realizar esta operación');
  }
  next();
}

module.exports = { generarToken, verificarToken, soloAdmin };
