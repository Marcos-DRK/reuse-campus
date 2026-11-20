const express = require('express');
const { sql, getPool } = require('../db');
const { ErrorApp } = require('../middlewares/errores');
const { verificarToken } = require('../middlewares/auth');
const { validarId } = require('../utils/validaciones');

const router = express.Router();

router.use(verificarToken);

// Entrega + publicación + propietario + receptor + mensaje de la solicitud (JOIN entre las 4 entidades)
const SELECT_ENTREGA = `
  SELECT e.id, e.publicacionId, e.solicitudId, e.propietarioId, e.receptorId,
         e.fechaAcuerdo, e.fechaEntrega, e.estado,
         p.titulo AS publicacionTitulo, p.estado AS publicacionEstado, p.modalidad,
         prop.nombre AS propietarioNombre, rec.nombre AS receptorNombre,
         s.mensaje AS solicitudMensaje
  FROM Entregas e
  INNER JOIN Publicaciones p ON p.id = e.publicacionId
  INNER JOIN Solicitudes s   ON s.id = e.solicitudId
  INNER JOIN Usuarios prop   ON prop.id = e.propietarioId
  INNER JOIN Usuarios rec    ON rec.id = e.receptorId
`;

async function buscarEntrega(pool, id) {
  const resultado = await pool.request().input('id', sql.Int, id).query(`${SELECT_ENTREGA} WHERE e.id = @id`);
  if (resultado.recordset.length === 0) {
    throw new ErrorApp(404, 'Entrega no encontrada');
  }
  return resultado.recordset[0];
}

// GET /api/entregas -> el ADMIN ve todas; un usuario ve aquellas donde es propietario o receptor
router.get('/', async (req, res) => {
  const pool = await getPool();
  const peticion = pool.request();
  let where = '';
  if (req.usuario.rol !== 'ADMIN') {
    peticion.input('usuarioId', sql.Int, req.usuario.id);
    where = 'WHERE e.propietarioId = @usuarioId OR e.receptorId = @usuarioId';
  }
  const resultado = await peticion.query(`${SELECT_ENTREGA} ${where} ORDER BY e.fechaAcuerdo DESC, e.id DESC`);
  res.status(200).json(resultado.recordset);
});

// GET /api/entregas/:id
router.get('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const pool = await getPool();
  const entrega = await buscarEntrega(pool, id);
  const u = req.usuario;
  if (entrega.propietarioId !== u.id && entrega.receptorId !== u.id && u.rol !== 'ADMIN') {
    throw new ErrorApp(403, 'No tiene permiso para ver esta entrega');
  }
  res.status(200).json(entrega);
});

// PATCH /api/entregas/:id/completar
// RN14: al confirmar la entrega como COMPLETADA, la publicación pasa automáticamente a ENTREGADA.
// RN13: la publicación solo llega a ENTREGADA desde RESERVADA (nunca directo desde DISPONIBLE).
router.patch('/:id/completar', async (req, res) => {
  const id = validarId(req.params.id);
  const pool = await getPool();
  const transaccion = new sql.Transaction(pool);
  await transaccion.begin();

  try {
    const resultado = await new sql.Request(transaccion).input('id', sql.Int, id).query(`
      SELECT e.id, e.estado, e.propietarioId, e.publicacionId, p.estado AS publicacionEstado
      FROM Entregas e WITH (UPDLOCK)
      INNER JOIN Publicaciones p WITH (UPDLOCK) ON p.id = e.publicacionId
      WHERE e.id = @id
    `);
    const entrega = resultado.recordset[0];
    if (!entrega) {
      throw new ErrorApp(404, 'Entrega no encontrada');
    }
    // Solo el propietario (quien entrega el artículo) o un administrador confirman la entrega
    if (entrega.propietarioId !== req.usuario.id && req.usuario.rol !== 'ADMIN') {
      throw new ErrorApp(403, 'Solo el propietario o un administrador pueden confirmar la entrega');
    }
    if (entrega.estado !== 'PENDIENTE') {
      throw new ErrorApp(409, 'La entrega ya fue completada');
    }
    if (entrega.publicacionEstado !== 'RESERVADA') {
      throw new ErrorApp(409, `La publicación debe estar RESERVADA para completar la entrega (estado actual: ${entrega.publicacionEstado})`);
    }

    await new sql.Request(transaccion)
      .input('id', sql.Int, id)
      .query("UPDATE Entregas SET estado = 'COMPLETADA', fechaEntrega = SYSUTCDATETIME() WHERE id = @id");

    await new sql.Request(transaccion)
      .input('publicacionId', sql.Int, entrega.publicacionId)
      .query("UPDATE Publicaciones SET estado = 'ENTREGADA' WHERE id = @publicacionId AND estado = 'RESERVADA'");

    await transaccion.commit();
  } catch (error) {
    await transaccion.rollback().catch(() => {}); // si SQL ya abortó la transacción, se ignora
    throw error;
  }

  res.status(200).json(await buscarEntrega(pool, id));
});

// Nota RN17: no existe DELETE de entregas; son historial y se conservan siempre.

module.exports = router;
