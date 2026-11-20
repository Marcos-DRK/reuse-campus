const express = require('express');
const cors = require('cors');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/errores');

const app = express();

app.use(cors());          // permite peticiones desde Angular (http://localhost:4200)
app.use(express.json());  // convierte el cuerpo JSON en req.body

app.get('/', (req, res) => {
  res.status(200).json({ mensaje: 'API ReUse Campus funcionando' });
});

// Rutas de la API REST
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/publicaciones', require('./routes/publicaciones'));
app.use('/api/solicitudes', require('./routes/solicitudes'));
app.use('/api/entregas', require('./routes/entregas'));

// 404 y manejador central de errores (deben ir al final)
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
