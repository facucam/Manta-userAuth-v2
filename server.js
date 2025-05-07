const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { dbConnection } = require('./src/db/config');
const validateJWT = require('./src/middleware/jwt.middleware');
const { pollMessages } = require('./src/services/listener.sqs');

const app = express();
const PORT = 8080;

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Conexión a base de datos
dbConnection();

// Endpoint libre
app.get('/test-free', (req, res) => {
  res.json({ message: 'Endpoint sin JWT' });
});

// Middleware global de autenticación (excepto login y register)
app.use((req, res, next) => {
  const publicRoutes = ['/login', '/register'];
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  validateJWT(req, res, next);
});

// Rutas de usuarios (donde estará el /register que publica eventos)
app.use('/', require('./src/routes/user.routes'));

// Iniciar servidor y listener
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  pollMessages()
    .then(() => console.log('Listener de SQS iniciado.'))
    .catch((error) => {
      console.error('Error iniciando el listener de SQS:', error);
      process.exit(1);
    });
});

module.exports = app;