const express = require('express');
const { sql, getPool } = require('../db');
const { ErrorApp } = require('../middlewares/errores');
const { verificarToken } = require('../middlewares/auth');
const {
  MODALIDADES,
  ESTADOS_PUBLICACION,
  validarId,
  validarTexto,
  validarOpcion
} = require('../utils/validaciones');

const router = express.Router();

// RN01: todas las operaciones de publicaciones requieren usuario autenticado
router.use(verificarToken);

// Consulta base: publicación + nombre del propietario (JOIN) + cantidad de solicitudes pendientes
const SELECT_PUBLICACION = `
  SELECT p.id, p.titulo, p.descripcion, p.categoria, p.modalidad, p.estado,
         p.fechaPublicacion, p.usuarioId, u.nombre AS propietarioNombre,
         (SELECT COUNT(*) FROM Solicitudes s
           WHERE s.publicacionId = p.id AND s.estado = 'PENDIENTE') AS solicitudesPendientes
  FROM Publicaciones p
  INNER JOIN Usuarios u ON u.id = p.usuarioId
`;

async function buscarPublicacion(pool, id) {
  const resultado = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`${SELECT_PUBLICACION} WHERE p.id = @id`);
  if (resultado.recordset.length === 0) {
    throw new ErrorApp(404, 'Publicación no encontrada');
  }
  return resultado.recordset[0];
}

// Solo el propietario (RN02) o un administrador pueden modificar una publicación
function validarPropietarioOAdmin(publicacion, usuario) {
  if (publicacion.usuarioId !== usuario.id && usuario.rol !== 'ADMIN') {
    throw new ErrorApp(403, 'Solo el propietario de la publicación puede realizar esta operación');
  }
}

function leerDatosPublicacion(body) {
  // RN13: el estado NO se puede cambiar editando la publicación; solo cambia con el flujo
  // (aceptar solicitud -> RESERVADA, completar entrega -> ENTREGADA, cancelar -> CANCELADA)
  if (body.estado !== undefined) {
    throw new ErrorApp(400, 'El estado de la publicación no se modifica directamente; cambia según el flujo de solicitudes y entregas');
  }
  return {
    titulo: validarTexto(body.titulo, 'título', 3, 150),
    descripcion: validarTexto(body.descripcion, 'descripción', 10, 1000),
    categoria: validarTexto(body.categoria, 'categoría', 3, 60),
    modalidad: validarOpcion(body.modalidad, MODALIDADES, 'modalidad')
  };
}

// GET /api/publicaciones?estado=DISPONIBLE&categoria=Libros&modalidad=DONACION&texto=calc
router.get('/', async (req, res) => {
  const pool = await getPool();
  const peticion = pool.request();
  const filtros = [];

  if (req.query.estado) {
    peticion.input('estado', sql.VarChar, validarOpcion(req.query.estado, ESTADOS_PUBLICACION, 'estado'));
    filtros.push('p.estado = @estado');
  }
  if (req.query.modalidad) {
    peticion.input('modalidad', sql.VarChar, validarOpcion(req.query.modalidad, MODALIDADES, 'modalidad'));
    filtros.push('p.modalidad = @modalidad');
  }
  if (req.query.categoria) {
    peticion.input('categoria', sql.NVarChar, String(req.query.categoria).trim());
    filtros.push('p.categoria = @categoria');
  }
  if (req.query.texto) {
    peticion.input('texto', sql.NVarChar, `%${String(req.query.texto).trim()}%`);
    filtros.push('(p.titulo LIKE @texto OR p.descripcion LIKE @texto)');
  }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
  const resultado = await peticion.query(`${SELECT_PUBLICACION} ${where} ORDER BY p.fechaPublicacion DESC, p.id DESC`);
  res.status(200).json(resultado.recordset);
});

// GET /api/publicaciones/mias -> publicaciones del usuario autenticado
router.get('/mias', async (req, res) => {
  const pool = await getPool();
  const resultado = await pool
    .request()
    .input('usuarioId', sql.Int, req.usuario.id)
    .query(`${SELECT_PUBLICACION} WHERE p.usuarioId = @usuarioId ORDER BY p.id DESC`);
  res.status(200).json(resultado.recordset);
});

// GET /api/publicaciones/:id
router.get('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const pool = await getPool();
  res.status(200).json(await buscarPublicacion(pool, id));
});

// POST /api/publicaciones
// RN01: requiere sesión (verificarToken). RN02: el propietario es SIEMPRE el usuario del token,
// nunca un usuarioId enviado en el cuerpo. Toda publicación nace DISPONIBLE.
router.post('/', async (req, res) => {
  const datos = leerDatosPublicacion(req.body);
  const pool = await getPool();
  const resultado = await pool
    .request()
    .input('titulo', sql.NVarChar, datos.titulo)
    .input('descripcion', sql.NVarChar, datos.descripcion)
    .input('categoria', sql.NVarChar, datos.categoria)
    .input('modalidad', sql.VarChar, datos.modalidad)
    .input('usuarioId', sql.Int, req.usuario.id)
    .query(`
      INSERT INTO Publicaciones (titulo, descripcion, categoria, modalidad, estado, usuarioId)
      OUTPUT INSERTED.id
      VALUES (@titulo, @descripcion, @categoria, @modalidad, 'DISPONIBLE', @usuarioId)
    `);

  res.status(201).json(await buscarPublicacion(pool, resultado.recordset[0].id));
});

// PUT /api/publicaciones/:id -> editar datos (solo propietario/admin y solo si está DISPONIBLE)
router.put('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const datos = leerDatosPublicacion(req.body);
  const pool = await getPool();
  const publicacion = await buscarPublicacion(pool, id);

  validarPropietarioOAdmin(publicacion, req.usuario);
  if (publicacion.estado !== 'DISPONIBLE') {
    throw new ErrorApp(409, `No se puede editar una publicación ${publicacion.estado}`);
  }

  await pool
    .request()
    .input('id', sql.Int, id)
    .input('titulo', sql.NVarChar, datos.titulo)
    .input('descripcion', sql.NVarChar, datos.descripcion)
    .input('categoria', sql.NVarChar, datos.categoria)
    .input('modalidad', sql.VarChar, datos.modalidad)
    .query(`
      UPDATE Publicaciones
      SET titulo = @titulo, descripcion = @descripcion, categoria = @categoria, modalidad = @modalidad
      WHERE id = @id
    `);

  res.status(200).json(await buscarPublicacion(pool, id));
});

// PATCH /api/publicaciones/:id/cancelar -> DISPONIBLE -> CANCELADA (baja lógica, RN17)
// Las solicitudes PENDIENTES de esa publicación pasan a RECHAZADA.
router.patch('/:id/cancelar', async (req, res) => {
  const id = validarId(req.params.id);
  const pool = await getPool();
  const publicacion = await buscarPublicacion(pool, id);

  validarPropietarioOAdmin(publicacion, req.usuario);
  if (publicacion.estado !== 'DISPONIBLE') {
    throw new ErrorApp(409, `Solo se puede cancelar una publicación DISPONIBLE (estado actual: ${publicacion.estado})`);
  }

  const transaccion = new sql.Transaction(pool);
  await transaccion.begin();
  try {
    await new sql.Request(transaccion)
      .input('id', sql.Int, id)
      .query("UPDATE Publicaciones SET estado = 'CANCELADA' WHERE id = @id");
    await new sql.Request(transaccion)
      .input('id', sql.Int, id)
      .query("UPDATE Solicitudes SET estado = 'RECHAZADA' WHERE publicacionId = @id AND estado = 'PENDIENTE'");
    await transaccion.commit();
  } catch (error) {
    await transaccion.rollback().catch(() => {}); // si SQL ya abortó la transacción, se ignora
    throw error;
  }

  res.status(200).json({ mensaje: 'Publicación cancelada correctamente' });
});

// DELETE /api/publicaciones/:id
// RN17: solo se elimina físicamente si NUNCA recibió solicitudes (no hay historial que conservar).
// Si tiene historial se debe usar "cancelar".
router.delete('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const pool = await getPool();
  const publicacion = await buscarPublicacion(pool, id);

  validarPropietarioOAdmin(publicacion, req.usuario);

  const historial = await pool
    .request()
    .input('id', sql.Int, id)
    .query('SELECT COUNT(*) AS total FROM Solicitudes WHERE publicacionId = @id');
  if (historial.recordset[0].total > 0) {
    throw new ErrorApp(409, 'La publicación tiene solicitudes asociadas; para conservar el historial debe cancelarla en lugar de eliminarla');
  }

  await pool.request().input('id', sql.Int, id).query('DELETE FROM Publicaciones WHERE id = @id');
  res.status(200).json({ mensaje: 'Publicación eliminada correctamente' });
});

module.exports = router;
