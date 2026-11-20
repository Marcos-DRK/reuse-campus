const express = require('express');
const { sql, getPool } = require('../db');
const { ErrorApp } = require('../middlewares/errores');
const { verificarToken } = require('../middlewares/auth');
const { validarId, validarTexto } = require('../utils/validaciones');

const router = express.Router();

router.use(verificarToken);

// Solicitud + datos de su publicación y del solicitante (JOIN entre 3 tablas)
const SELECT_SOLICITUD = `
  SELECT s.id, s.publicacionId, s.solicitanteId, s.mensaje, s.fechaSolicitud, s.estado,
         p.titulo AS publicacionTitulo, p.estado AS publicacionEstado, p.usuarioId AS propietarioId,
         prop.nombre AS propietarioNombre,
         sol.nombre AS solicitanteNombre, sol.correo AS solicitanteCorreo
  FROM Solicitudes s
  INNER JOIN Publicaciones p ON p.id = s.publicacionId
  INNER JOIN Usuarios prop  ON prop.id = p.usuarioId
  INNER JOIN Usuarios sol   ON sol.id = s.solicitanteId
`;

async function buscarSolicitud(peticion, id) {
  const resultado = await peticion.input('id', sql.Int, id).query(`${SELECT_SOLICITUD} WHERE s.id = @id`);
  if (resultado.recordset.length === 0) {
    throw new ErrorApp(404, 'Solicitud no encontrada');
  }
  return resultado.recordset[0];
}

// GET /api/solicitudes/mias -> solicitudes hechas por el usuario autenticado
router.get('/mias', async (req, res) => {
  const pool = await getPool();
  const resultado = await pool
    .request()
    .input('usuarioId', sql.Int, req.usuario.id)
    .query(`${SELECT_SOLICITUD} WHERE s.solicitanteId = @usuarioId ORDER BY s.fechaSolicitud DESC, s.id DESC`);
  res.status(200).json(resultado.recordset);
});

// GET /api/solicitudes/publicacion/:id -> solicitudes recibidas por una publicación (propietario o admin)
router.get('/publicacion/:id', async (req, res) => {
  const publicacionId = validarId(req.params.id, 'ID de publicación');
  const pool = await getPool();

  const publicacion = await pool
    .request()
    .input('id', sql.Int, publicacionId)
    .query('SELECT id, usuarioId FROM Publicaciones WHERE id = @id');
  if (publicacion.recordset.length === 0) {
    throw new ErrorApp(404, 'Publicación no encontrada');
  }
  if (publicacion.recordset[0].usuarioId !== req.usuario.id && req.usuario.rol !== 'ADMIN') {
    throw new ErrorApp(403, 'Solo el propietario puede ver las solicitudes de su publicación');
  }

  const resultado = await pool
    .request()
    .input('publicacionId', sql.Int, publicacionId)
    .query(`${SELECT_SOLICITUD} WHERE s.publicacionId = @publicacionId ORDER BY s.fechaSolicitud ASC, s.id ASC`);
  res.status(200).json(resultado.recordset);
});

// GET /api/solicitudes/:id -> solicitante, propietario o admin
router.get('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const pool = await getPool();
  const solicitud = await buscarSolicitud(pool.request(), id);
  const u = req.usuario;
  if (solicitud.solicitanteId !== u.id && solicitud.propietarioId !== u.id && u.rol !== 'ADMIN') {
    throw new ErrorApp(403, 'No tiene permiso para ver esta solicitud');
  }
  res.status(200).json(solicitud);
});

// POST /api/solicitudes  { publicacionId, mensaje }
router.post('/', async (req, res) => {
  const publicacionId = validarId(req.body.publicacionId, 'ID de publicación');
  const mensaje = validarTexto(req.body.mensaje, 'mensaje', 5, 500);
  const pool = await getPool();

  const resultadoPub = await pool
    .request()
    .input('id', sql.Int, publicacionId)
    .query('SELECT id, usuarioId, estado FROM Publicaciones WHERE id = @id');
  const publicacion = resultadoPub.recordset[0];
  if (!publicacion) {
    throw new ErrorApp(404, 'Publicación no encontrada');
  }

  // RN03: el propietario no puede solicitar su propia publicación
  if (publicacion.usuarioId === req.usuario.id) {
    throw new ErrorApp(403, 'No puede solicitar su propia publicación');
  }

  // RN04 / RN12 / RN15: solo se solicita una publicación DISPONIBLE
  // (RESERVADA, ENTREGADA o CANCELADA no reciben nuevas solicitudes)
  if (publicacion.estado !== 'DISPONIBLE') {
    throw new ErrorApp(409, `La publicación está ${publicacion.estado} y no admite nuevas solicitudes`);
  }

  // RN05: el mismo usuario no puede tener dos solicitudes PENDIENTES sobre la misma publicación
  // (también lo garantiza el índice único filtrado UX_Solicitudes_pendiente_unica)
  const duplicada = await pool
    .request()
    .input('publicacionId', sql.Int, publicacionId)
    .input('solicitanteId', sql.Int, req.usuario.id)
    .query(`
      SELECT id FROM Solicitudes
      WHERE publicacionId = @publicacionId AND solicitanteId = @solicitanteId AND estado = 'PENDIENTE'
    `);
  if (duplicada.recordset.length > 0) {
    throw new ErrorApp(409, 'Ya tiene una solicitud PENDIENTE para esta publicación');
  }

  // RN06: varias personas pueden solicitar la misma publicación mientras siga DISPONIBLE
  const resultado = await pool
    .request()
    .input('publicacionId', sql.Int, publicacionId)
    .input('solicitanteId', sql.Int, req.usuario.id)
    .input('mensaje', sql.NVarChar, mensaje)
    .query(`
      INSERT INTO Solicitudes (publicacionId, solicitanteId, mensaje, estado)
      OUTPUT INSERTED.id
      VALUES (@publicacionId, @solicitanteId, @mensaje, 'PENDIENTE')
    `);

  res.status(201).json(await buscarSolicitud(pool.request(), resultado.recordset[0].id));
});

// PUT /api/solicitudes/:id { mensaje } -> el solicitante corrige su mensaje mientras esté PENDIENTE
router.put('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const mensaje = validarTexto(req.body.mensaje, 'mensaje', 5, 500);
  const pool = await getPool();
  const solicitud = await buscarSolicitud(pool.request(), id);

  if (solicitud.solicitanteId !== req.usuario.id) {
    throw new ErrorApp(403, 'Solo el solicitante puede modificar su solicitud');
  }
  if (solicitud.estado !== 'PENDIENTE') {
    throw new ErrorApp(409, `No se puede modificar una solicitud ${solicitud.estado}`);
  }

  await pool
    .request()
    .input('id', sql.Int, id)
    .input('mensaje', sql.NVarChar, mensaje)
    .query('UPDATE Solicitudes SET mensaje = @mensaje WHERE id = @id');

  res.status(200).json(await buscarSolicitud(pool.request(), id));
});

// PATCH /api/solicitudes/:id/aceptar
// Operación central del negocio. Se ejecuta en UNA TRANSACCIÓN: o se aplican todos los cambios o ninguno.
router.patch('/:id/aceptar', async (req, res) => {
  const id = validarId(req.params.id);
  const pool = await getPool();
  const transaccion = new sql.Transaction(pool);
  await transaccion.begin();

  try {
    // UPDLOCK bloquea la solicitud y su publicación hasta el COMMIT,
    // así dos aceptaciones simultáneas no pueden reservar la misma publicación.
    const resultado = await new sql.Request(transaccion).input('id', sql.Int, id).query(`
      SELECT s.id, s.estado, s.solicitanteId, s.publicacionId,
             p.usuarioId AS propietarioId, p.estado AS publicacionEstado
      FROM Solicitudes s WITH (UPDLOCK)
      INNER JOIN Publicaciones p WITH (UPDLOCK) ON p.id = s.publicacionId
      WHERE s.id = @id
    `);
    const solicitud = resultado.recordset[0];
    if (!solicitud) {
      throw new ErrorApp(404, 'Solicitud no encontrada');
    }

    // RN07: solo el propietario de la publicación puede aceptar
    if (solicitud.propietarioId !== req.usuario.id) {
      throw new ErrorApp(403, 'Solo el propietario de la publicación puede aceptar solicitudes');
    }
    if (solicitud.estado !== 'PENDIENTE') {
      throw new ErrorApp(409, `Solo se puede aceptar una solicitud PENDIENTE (estado actual: ${solicitud.estado})`);
    }
    // RN08: si la publicación ya no está DISPONIBLE es porque ya hay una solicitud aceptada (o fue cerrada)
    if (solicitud.publicacionEstado !== 'DISPONIBLE') {
      throw new ErrorApp(409, `La publicación está ${solicitud.publicacionEstado}; ya no se pueden aceptar solicitudes`);
    }

    // 1) La solicitud queda ACEPTADA (RN08: índice único filtrado impide una segunda ACEPTADA)
    await new sql.Request(transaccion)
      .input('id', sql.Int, id)
      .query("UPDATE Solicitudes SET estado = 'ACEPTADA' WHERE id = @id");

    // 2) RN09: la publicación pasa automáticamente de DISPONIBLE a RESERVADA
    await new sql.Request(transaccion)
      .input('publicacionId', sql.Int, solicitud.publicacionId)
      .query("UPDATE Publicaciones SET estado = 'RESERVADA' WHERE id = @publicacionId AND estado = 'DISPONIBLE'");

    // 3) RN10: las demás solicitudes PENDIENTES de esa publicación pasan a RECHAZADA
    const rechazadas = await new sql.Request(transaccion)
      .input('publicacionId', sql.Int, solicitud.publicacionId)
      .input('id', sql.Int, id)
      .query(`
        UPDATE Solicitudes SET estado = 'RECHAZADA'
        WHERE publicacionId = @publicacionId AND estado = 'PENDIENTE' AND id <> @id
      `);

    // 4) RN11: se genera la Entrega/Intercambio en estado PENDIENTE
    const entrega = await new sql.Request(transaccion)
      .input('publicacionId', sql.Int, solicitud.publicacionId)
      .input('solicitudId', sql.Int, id)
      .input('propietarioId', sql.Int, solicitud.propietarioId)
      .input('receptorId', sql.Int, solicitud.solicitanteId)
      .query(`
        INSERT INTO Entregas (publicacionId, solicitudId, propietarioId, receptorId, estado)
        OUTPUT INSERTED.id
        VALUES (@publicacionId, @solicitudId, @propietarioId, @receptorId, 'PENDIENTE')
      `);

    await transaccion.commit();

    res.status(200).json({
      mensaje: 'Solicitud aceptada. La publicación quedó RESERVADA y se generó la entrega',
      entregaId: entrega.recordset[0].id,
      solicitudesRechazadas: rechazadas.rowsAffected[0]
    });
  } catch (error) {
    await transaccion.rollback().catch(() => {}); // si SQL ya abortó la transacción, se ignora
    throw error;
  }
});

// PATCH /api/solicitudes/:id/rechazar -> RN07: solo el propietario rechaza
router.patch('/:id/rechazar', async (req, res) => {
  const id = validarId(req.params.id);
  const pool = await getPool();
  const solicitud = await buscarSolicitud(pool.request(), id);

  if (solicitud.propietarioId !== req.usuario.id) {
    throw new ErrorApp(403, 'Solo el propietario de la publicación puede rechazar solicitudes');
  }
  if (solicitud.estado !== 'PENDIENTE') {
    throw new ErrorApp(409, `Solo se puede rechazar una solicitud PENDIENTE (estado actual: ${solicitud.estado})`);
  }

  await pool.request().input('id', sql.Int, id).query("UPDATE Solicitudes SET estado = 'RECHAZADA' WHERE id = @id");
  res.status(200).json({ mensaje: 'Solicitud rechazada' });
});

// PATCH /api/solicitudes/:id/cancelar -> RN16: el solicitante cancela solo mientras esté PENDIENTE
// RN17: no se borra la fila, se cambia el estado para conservar el historial.
router.patch('/:id/cancelar', async (req, res) => {
  const id = validarId(req.params.id);
  const pool = await getPool();
  const solicitud = await buscarSolicitud(pool.request(), id);

  if (solicitud.solicitanteId !== req.usuario.id) {
    throw new ErrorApp(403, 'Solo el solicitante puede cancelar su solicitud');
  }
  if (solicitud.estado !== 'PENDIENTE') {
    throw new ErrorApp(409, `Solo puede cancelar una solicitud PENDIENTE (estado actual: ${solicitud.estado})`);
  }

  await pool.request().input('id', sql.Int, id).query("UPDATE Solicitudes SET estado = 'CANCELADA' WHERE id = @id");
  res.status(200).json({ mensaje: 'Solicitud cancelada' });
});

module.exports = router;
