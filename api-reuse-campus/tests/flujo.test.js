// Pruebas automáticas de la API contra la base de datos real (ReUseCampusDB).
// Ejecutar:  npm test   (no requiere tener el servidor encendido; supertest levanta la app en memoria)
// Cada ejecución crea usuarios nuevos con correo único, por lo que se puede repetir sin reiniciar la BD.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { cerrarPool } = require('../src/db');

const marca = Date.now();
const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function registrar(nombre) {
  const res = await request(app)
    .post('/api/auth/registro')
    .send({ nombre, correo: `${nombre.toLowerCase()}.${marca}@test.cl`, password: 'Clave123' });
  assert.equal(res.status, 201, res.body.mensaje);
  return { token: res.body.token, id: res.body.usuario.id };
}

async function login(correo, password) {
  const res = await request(app).post('/api/auth/login').send({ correo, password });
  assert.equal(res.status, 200, res.body.mensaje);
  return res.body.token;
}

async function crearPublicacion(token, titulo = 'Calculadora de prueba') {
  const res = await request(app)
    .post('/api/publicaciones')
    .set(auth(token))
    .send({ titulo, descripcion: 'Artículo creado por las pruebas automáticas', categoria: 'Calculadoras', modalidad: 'DONACION' });
  assert.equal(res.status, 201, res.body.mensaje);
  return res.body;
}

let propietario, solicitanteA, solicitanteB, adminToken;

before(async () => {
  propietario = await registrar('Propietario');
  solicitanteA = await registrar('SolicitanteA');
  solicitanteB = await registrar('SolicitanteB');
  adminToken = await login('admin@reuse.cl', 'Admin123');
});

after(async () => {
  await cerrarPool();
});

describe('Flujo funcional completo (punto 7)', () => {
  test('publicar -> 2 solicitudes -> aceptar -> RESERVADA/RECHAZADA/Entrega -> completar -> ENTREGADA', async () => {
    const pub = await crearPublicacion(propietario.token);
    assert.equal(pub.estado, 'DISPONIBLE');
    assert.equal(pub.usuarioId, propietario.id); // RN02

    // RN06: dos usuarios distintos solicitan la misma publicación
    const s1 = await request(app).post('/api/solicitudes').set(auth(solicitanteA.token))
      .send({ publicacionId: pub.id, mensaje: 'Me interesa mucho, gracias' });
    const s2 = await request(app).post('/api/solicitudes').set(auth(solicitanteB.token))
      .send({ publicacionId: pub.id, mensaje: 'También me sirve para mis clases' });
    assert.equal(s1.status, 201);
    assert.equal(s2.status, 201);
    assert.equal(s1.body.estado, 'PENDIENTE');

    // El propietario acepta la primera
    const aceptar = await request(app).patch(`/api/solicitudes/${s1.body.id}/aceptar`).set(auth(propietario.token));
    assert.equal(aceptar.status, 200, aceptar.body.mensaje);
    assert.equal(aceptar.body.solicitudesRechazadas, 1);

    // RN09: publicación RESERVADA
    const pubReservada = await request(app).get(`/api/publicaciones/${pub.id}`).set(auth(propietario.token));
    assert.equal(pubReservada.body.estado, 'RESERVADA');

    // RN10: la otra solicitud quedó RECHAZADA
    const otra = await request(app).get(`/api/solicitudes/${s2.body.id}`).set(auth(solicitanteB.token));
    assert.equal(otra.body.estado, 'RECHAZADA');

    // RN11: se generó una Entrega PENDIENTE
    const entrega = await request(app).get(`/api/entregas/${aceptar.body.entregaId}`).set(auth(propietario.token));
    assert.equal(entrega.status, 200);
    assert.equal(entrega.body.estado, 'PENDIENTE');
    assert.equal(entrega.body.receptorId, solicitanteA.id);

    // RN12: publicación RESERVADA no recibe nuevas solicitudes
    const tercero = await registrar('Tercero');
    const sReservada = await request(app).post('/api/solicitudes').set(auth(tercero.token))
      .send({ publicacionId: pub.id, mensaje: 'Llego tarde pero me interesa' });
    assert.equal(sReservada.status, 409);

    // RN08: no se puede aceptar una segunda solicitud de la misma publicación
    const segunda = await request(app).patch(`/api/solicitudes/${s2.body.id}/aceptar`).set(auth(propietario.token));
    assert.equal(segunda.status, 409);

    // El receptor no puede confirmar la entrega (solo propietario/admin)
    const noAutorizado = await request(app).patch(`/api/entregas/${aceptar.body.entregaId}/completar`).set(auth(solicitanteA.token));
    assert.equal(noAutorizado.status, 403);

    // RN14: completar entrega -> publicación ENTREGADA
    const completar = await request(app).patch(`/api/entregas/${aceptar.body.entregaId}/completar`).set(auth(propietario.token));
    assert.equal(completar.status, 200, completar.body.mensaje);
    assert.equal(completar.body.estado, 'COMPLETADA');
    assert.equal(completar.body.publicacionEstado, 'ENTREGADA');
    assert.ok(completar.body.fechaEntrega);

    // No se puede completar dos veces
    const otraVez = await request(app).patch(`/api/entregas/${aceptar.body.entregaId}/completar`).set(auth(propietario.token));
    assert.equal(otraVez.status, 409);

    // RN15: publicación ENTREGADA no recibe solicitudes
    const sEntregada = await request(app).post('/api/solicitudes').set(auth(tercero.token))
      .send({ publicacionId: pub.id, mensaje: 'Todavía me interesa' });
    assert.equal(sEntregada.status, 409);

    // RN17: con historial no se puede eliminar físicamente
    const borrar = await request(app).delete(`/api/publicaciones/${pub.id}`).set(auth(propietario.token));
    assert.equal(borrar.status, 409);
  });
});

describe('Reglas de negocio y situaciones inválidas (punto 8)', () => {
  test('RN01: sin sesión no se puede publicar (401)', async () => {
    const res = await request(app).post('/api/publicaciones')
      .send({ titulo: 'Sin login', descripcion: 'No debería guardarse', categoria: 'Libros', modalidad: 'DONACION' });
    assert.equal(res.status, 401);
  });

  test('RN02: el usuarioId del cuerpo se ignora; el dueño es el del token', async () => {
    const res = await request(app).post('/api/publicaciones').set(auth(propietario.token))
      .send({ titulo: 'Intento suplantar', descripcion: 'Envío otro usuarioId en el body', categoria: 'Libros', modalidad: 'DONACION', usuarioId: solicitanteA.id });
    assert.equal(res.status, 201);
    assert.equal(res.body.usuarioId, propietario.id);
  });

  test('RN03: el propietario no puede solicitar su propia publicación (403)', async () => {
    const pub = await crearPublicacion(propietario.token);
    const res = await request(app).post('/api/solicitudes').set(auth(propietario.token))
      .send({ publicacionId: pub.id, mensaje: 'Me la pido a mí mismo' });
    assert.equal(res.status, 403);
  });

  test('RN05: solicitud PENDIENTE duplicada (409)', async () => {
    const pub = await crearPublicacion(propietario.token);
    const datos = { publicacionId: pub.id, mensaje: 'Primera solicitud' };
    const r1 = await request(app).post('/api/solicitudes').set(auth(solicitanteA.token)).send(datos);
    const r2 = await request(app).post('/api/solicitudes').set(auth(solicitanteA.token)).send(datos);
    assert.equal(r1.status, 201);
    assert.equal(r2.status, 409);
  });

  test('RN07: un usuario que no es dueño no puede aceptar ni rechazar (403)', async () => {
    const pub = await crearPublicacion(propietario.token);
    const sol = await request(app).post('/api/solicitudes').set(auth(solicitanteA.token))
      .send({ publicacionId: pub.id, mensaje: 'Quiero este artículo' });
    const aceptar = await request(app).patch(`/api/solicitudes/${sol.body.id}/aceptar`).set(auth(solicitanteB.token));
    const rechazar = await request(app).patch(`/api/solicitudes/${sol.body.id}/rechazar`).set(auth(solicitanteB.token));
    assert.equal(aceptar.status, 403);
    assert.equal(rechazar.status, 403);
  });

  test('RN13: el estado no se cambia editando la publicación (400)', async () => {
    const pub = await crearPublicacion(propietario.token);
    const res = await request(app).put(`/api/publicaciones/${pub.id}`).set(auth(propietario.token))
      .send({ titulo: pub.titulo, descripcion: pub.descripcion, categoria: pub.categoria, modalidad: pub.modalidad, estado: 'ENTREGADA' });
    assert.equal(res.status, 400);
  });

  test('RN16: el solicitante cancela solo mientras está PENDIENTE', async () => {
    const pub = await crearPublicacion(propietario.token);
    const sol = await request(app).post('/api/solicitudes').set(auth(solicitanteA.token))
      .send({ publicacionId: pub.id, mensaje: 'La cancelaré luego' });
    const otro = await request(app).patch(`/api/solicitudes/${sol.body.id}/cancelar`).set(auth(solicitanteB.token));
    assert.equal(otro.status, 403);
    const c1 = await request(app).patch(`/api/solicitudes/${sol.body.id}/cancelar`).set(auth(solicitanteA.token));
    assert.equal(c1.status, 200);
    const c2 = await request(app).patch(`/api/solicitudes/${sol.body.id}/cancelar`).set(auth(solicitanteA.token));
    assert.equal(c2.status, 409);
  });

  test('Publicación CANCELADA no recibe solicitudes (409)', async () => {
    const pub = await crearPublicacion(propietario.token);
    const cancelar = await request(app).patch(`/api/publicaciones/${pub.id}/cancelar`).set(auth(propietario.token));
    assert.equal(cancelar.status, 200);
    const res = await request(app).post('/api/solicitudes').set(auth(solicitanteA.token))
      .send({ publicacionId: pub.id, mensaje: 'Quiero una cancelada' });
    assert.equal(res.status, 409);
  });

  test('Datos obligatorios incompletos o inválidos (400)', async () => {
    const r1 = await request(app).post('/api/publicaciones').set(auth(propietario.token))
      .send({ titulo: '', descripcion: 'x', categoria: 'Libros', modalidad: 'VENTA' });
    const r2 = await request(app).post('/api/solicitudes').set(auth(solicitanteA.token)).send({ publicacionId: 'abc', mensaje: 'hola mundo' });
    const r3 = await request(app).post('/api/auth/registro').send({ nombre: 'Al', correo: 'no-es-correo', password: '1' });
    assert.equal(r1.status, 400);
    assert.equal(r2.status, 400);
    assert.equal(r3.status, 400);
  });

  test('Recurso inexistente (404) e ID inválido (400)', async () => {
    const r1 = await request(app).get('/api/publicaciones/999999').set(auth(propietario.token));
    const r2 = await request(app).patch('/api/solicitudes/999999/aceptar').set(auth(propietario.token));
    const r3 = await request(app).get('/api/publicaciones/abc').set(auth(propietario.token));
    const r4 = await request(app).get('/api/no-existe');
    assert.equal(r1.status, 404);
    assert.equal(r2.status, 404);
    assert.equal(r3.status, 400);
    assert.equal(r4.status, 404);
  });

  test('Roles: un USUARIO no accede a /api/usuarios (403) y el ADMIN sí (200)', async () => {
    const r1 = await request(app).get('/api/usuarios').set(auth(solicitanteA.token));
    const r2 = await request(app).get('/api/usuarios').set(auth(adminToken));
    assert.equal(r1.status, 403);
    assert.equal(r2.status, 200);
  });

  test('Login inválido (401) y usuario INACTIVO no puede ingresar (403)', async () => {
    const malo = await request(app).post('/api/auth/login').send({ correo: 'admin@reuse.cl', password: 'incorrecta' });
    assert.equal(malo.status, 401);

    const usuario = await registrar('Inactivo');
    const baja = await request(app).delete(`/api/usuarios/${usuario.id}`).set(auth(adminToken));
    assert.equal(baja.status, 200);
    const res = await request(app).post('/api/auth/login').send({ correo: `inactivo.${marca}@test.cl`, password: 'Clave123' });
    assert.equal(res.status, 403);
    // Su token anterior también deja de servir
    const conToken = await request(app).get('/api/publicaciones').set(auth(usuario.token));
    assert.equal(conToken.status, 403);
  });

  test('Token inválido (401) y JSON mal formado (400)', async () => {
    const r1 = await request(app).get('/api/publicaciones').set(auth('token-falso'));
    const r2 = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"correo": ');
    assert.equal(r1.status, 401);
    assert.equal(r2.status, 400);
  });
});
