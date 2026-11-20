const { ErrorApp } = require('../middlewares/errores');

const ROLES = ['USUARIO', 'ADMIN'];
const ESTADOS_USUARIO = ['ACTIVO', 'INACTIVO'];
const MODALIDADES = ['DONACION', 'INTERCAMBIO'];
const ESTADOS_PUBLICACION = ['DISPONIBLE', 'RESERVADA', 'ENTREGADA', 'CANCELADA'];

// Igual que en la Actividad 6: el id debe ser un entero positivo
function validarId(valor, nombre = 'ID') {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorApp(400, `${nombre} inválido`);
  }
  return id;
}

// Texto obligatorio con largo mínimo y máximo. Devuelve el texto sin espacios extremos.
function validarTexto(valor, campo, min = 1, max = 255) {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new ErrorApp(400, `El campo ${campo} es obligatorio`);
  }
  const texto = valor.trim();
  if (texto.length < min) {
    throw new ErrorApp(400, `El campo ${campo} debe tener al menos ${min} caracteres`);
  }
  if (texto.length > max) {
    throw new ErrorApp(400, `El campo ${campo} no puede superar ${max} caracteres`);
  }
  return texto;
}

function validarCorreo(valor) {
  const correo = validarTexto(valor, 'correo', 5, 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new ErrorApp(400, 'El correo no tiene un formato válido');
  }
  return correo;
}

function validarPassword(valor) {
  if (typeof valor !== 'string' || valor.length < 6) {
    throw new ErrorApp(400, 'La contraseña debe tener al menos 6 caracteres');
  }
  return valor;
}

// Valida que el valor pertenezca a una lista de opciones permitidas
function validarOpcion(valor, opciones, campo) {
  const texto = typeof valor === 'string' ? valor.trim().toUpperCase() : '';
  if (!opciones.includes(texto)) {
    throw new ErrorApp(400, `El campo ${campo} debe ser uno de: ${opciones.join(', ')}`);
  }
  return texto;
}

module.exports = {
  ROLES,
  ESTADOS_USUARIO,
  MODALIDADES,
  ESTADOS_PUBLICACION,
  validarId,
  validarTexto,
  validarCorreo,
  validarPassword,
  validarOpcion
};
