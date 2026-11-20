const express = require('express');
const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../db');
const { ErrorApp } = require('../middlewares/errores');
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const {
  ROLES,
  ESTADOS_USUARIO,
  validarId,
  validarTexto,
  validarCorreo,
  validarPassword,
  validarOpcion
} = require('../utils/validaciones');

const router = express.Router();

// Todas las rutas de usuarios son exclusivas del ADMINISTRADOR (control de acceso por rol)
router.use(verificarToken, soloAdmin);

const COLUMNAS = 'id, nombre, correo, rol, estado, fechaRegistro';

async function buscarUsuario(pool, id) {
  const resultado = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT ${COLUMNAS} FROM Usuarios WHERE id = @id`);
  if (resultado.recordset.length === 0) {
    throw new ErrorApp(404, 'Usuario no encontrado');
  }
  return resultado.recordset[0];
}

// GET /api/usuarios
router.get('/', async (req, res) => {
  const pool = await getPool();
  const resultado = await pool.request().query(`SELECT ${COLUMNAS} FROM Usuarios ORDER BY id`);
  res.status(200).json(resultado.recordset);
});

// GET /api/usuarios/:id
router.get('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const pool = await getPool();
  res.status(200).json(await buscarUsuario(pool, id));
});

// POST /api/usuarios -> el administrador crea un usuario con el rol indicado
router.post('/', async (req, res) => {
  const nombre = validarTexto(req.body.nombre, 'nombre', 3, 100);
  const correo = validarCorreo(req.body.correo);
  const password = validarPassword(req.body.password);
  const rol = validarOpcion(req.body.rol ?? 'USUARIO', ROLES, 'rol');

  const pool = await getPool();
  const hash = await bcrypt.hash(password, 10);
  const resultado = await pool
    .request()
    .input('nombre', sql.NVarChar, nombre)
    .input('correo', sql.NVarChar, correo)
    .input('password', sql.NVarChar, hash)
    .input('rol', sql.VarChar, rol)
    .query(`
      INSERT INTO Usuarios (nombre, correo, password, rol, estado)
      OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.correo, INSERTED.rol, INSERTED.estado, INSERTED.fechaRegistro
      VALUES (@nombre, @correo, @password, @rol, 'ACTIVO')
    `); // correo duplicado -> índice UNIQUE -> 409 en el manejador central

  res.status(201).json(resultado.recordset[0]);
});

// PUT /api/usuarios/:id -> actualiza nombre, correo, rol, estado (y contraseña si se envía)
router.put('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const nombre = validarTexto(req.body.nombre, 'nombre', 3, 100);
  const correo = validarCorreo(req.body.correo);
  const rol = validarOpcion(req.body.rol, ROLES, 'rol');
  const estado = validarOpcion(req.body.estado, ESTADOS_USUARIO, 'estado');

  // Un administrador no puede quitarse a sí mismo el rol ni desactivarse (quedaría sin acceso)
  if (id === req.usuario.id && (rol !== 'ADMIN' || estado !== 'ACTIVO')) {
    throw new ErrorApp(409, 'No puede quitarse el rol de administrador ni desactivar su propia cuenta');
  }

  const pool = await getPool();
  await buscarUsuario(pool, id);

  const peticion = pool
    .request()
    .input('id', sql.Int, id)
    .input('nombre', sql.NVarChar, nombre)
    .input('correo', sql.NVarChar, correo)
    .input('rol', sql.VarChar, rol)
    .input('estado', sql.VarChar, estado);

  let setPassword = '';
  if (req.body.password) {
    peticion.input('password', sql.NVarChar, await bcrypt.hash(validarPassword(req.body.password), 10));
    setPassword = ', password = @password';
  }

  await peticion.query(`
    UPDATE Usuarios
    SET nombre = @nombre, correo = @correo, rol = @rol, estado = @estado${setPassword}
    WHERE id = @id
  `);

  res.status(200).json({ mensaje: 'Usuario actualizado correctamente' });
});

// DELETE /api/usuarios/:id -> RN17: baja LÓGICA (estado INACTIVO). No se borra para conservar el historial.
router.delete('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  if (id === req.usuario.id) {
    throw new ErrorApp(409, 'No puede desactivar su propia cuenta');
  }

  const pool = await getPool();
  await buscarUsuario(pool, id);
  await pool
    .request()
    .input('id', sql.Int, id)
    .query("UPDATE Usuarios SET estado = 'INACTIVO' WHERE id = @id");

  res.status(200).json({ mensaje: 'Usuario desactivado correctamente' });
});

module.exports = router;
