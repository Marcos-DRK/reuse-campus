const express = require('express');
const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../db');
const { ErrorApp } = require('../middlewares/errores');
const { generarToken, verificarToken } = require('../middlewares/auth');
const { validarTexto, validarCorreo, validarPassword } = require('../utils/validaciones');

const router = express.Router();

// POST /api/auth/registro -> crea una cuenta con rol USUARIO
router.post('/registro', async (req, res) => {
  const nombre = validarTexto(req.body.nombre, 'nombre', 3, 100);
  const correo = validarCorreo(req.body.correo);
  const password = validarPassword(req.body.password);

  const pool = await getPool();
  const existe = await pool
    .request()
    .input('correo', sql.NVarChar, correo)
    .query('SELECT id FROM Usuarios WHERE correo = @correo');
  if (existe.recordset.length > 0) {
    throw new ErrorApp(409, 'Ya existe una cuenta registrada con ese correo');
  }

  const hash = await bcrypt.hash(password, 10);
  const resultado = await pool
    .request()
    .input('nombre', sql.NVarChar, nombre)
    .input('correo', sql.NVarChar, correo)
    .input('password', sql.NVarChar, hash)
    .query(`
      INSERT INTO Usuarios (nombre, correo, password, rol, estado)
      OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.correo, INSERTED.rol, INSERTED.estado
      VALUES (@nombre, @correo, @password, 'USUARIO', 'ACTIVO')
    `);

  const usuario = resultado.recordset[0];
  res.status(201).json({ token: generarToken(usuario), usuario });
});

// POST /api/auth/login -> valida correo y contraseña y entrega un token JWT
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) {
    throw new ErrorApp(400, 'Ingrese correo y contraseña');
  }

  const pool = await getPool();
  const resultado = await pool
    .request()
    .input('correo', sql.NVarChar, String(correo).trim().toLowerCase())
    .query('SELECT id, nombre, correo, password, rol, estado FROM Usuarios WHERE correo = @correo');

  const usuario = resultado.recordset[0];
  // Mismo mensaje si no existe el correo o si la contraseña es incorrecta (no revela qué falló)
  if (!usuario || !(await bcrypt.compare(String(password), usuario.password))) {
    throw new ErrorApp(401, 'Correo o contraseña incorrectos');
  }
  if (usuario.estado !== 'ACTIVO') {
    throw new ErrorApp(403, 'Su cuenta está inactiva. Contacte al administrador');
  }

  delete usuario.password;
  res.status(200).json({ token: generarToken(usuario), usuario });
});

// GET /api/auth/perfil -> datos del usuario autenticado
router.get('/perfil', verificarToken, (req, res) => {
  res.status(200).json(req.usuario);
});

module.exports = router;
