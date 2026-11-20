// Error controlado de la aplicación: lleva el código HTTP y un mensaje comprensible para el usuario.
class ErrorApp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

// Ruta no encontrada (404)
function rutaNoEncontrada(req, res) {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// Manejador central de errores: todas las rutas terminan aquí con next(error)
// eslint-disable-next-line no-unused-vars
function manejadorErrores(error, req, res, next) {
  // Errores lanzados a propósito por las reglas de negocio
  if (error instanceof ErrorApp) {
    return res.status(error.status).json({ mensaje: error.message });
  }

  // JSON mal formado en el cuerpo de la petición
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la solicitud no es un JSON válido' });
  }

  // Violación de índice único en SQL Server (2627 = UNIQUE constraint, 2601 = índice único)
  const numeroSql = error.number || error.originalError?.info?.number || error.originalError?.code;
  if (numeroSql === 2627 || numeroSql === 2601) {
    if (String(error.message).includes('UQ_Usuarios_correo')) {
      return res.status(409).json({ mensaje: 'Ya existe un usuario registrado con ese correo' });
    }
    return res.status(409).json({ mensaje: 'El registro entra en conflicto con uno existente (dato duplicado)' });
  }
  // Violación de clave foránea o CHECK
  if (numeroSql === 547) {
    return res.status(409).json({ mensaje: 'La operación viola la integridad de los datos relacionados' });
  }

  console.error(error);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = { ErrorApp, rutaNoEncontrada, manejadorErrores };
