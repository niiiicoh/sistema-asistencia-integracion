process.env.TZ = 'America/Santiago';
require('dotenv').config();
const express = require('express');
const path = require('node:path');
const AppError = require('./src/utils/AppError');

function createApp({ usuarioService, asistenciaService, authService, reporteService, configuracionService }) {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.use(express.json({ limit: '16kb' }));
  const { token, admin } = require('./src/middleware/auth');
  const intentos = new Map();
  const cookie = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 8 * 60 * 60 * 1000 };
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const origin = req.get('origin');
      if (origin && origin !== req.protocol + '://' + req.get('host')) throw new AppError(403, 'Origen de solicitud no permitido.');
      if (req.method !== 'DELETE' && !req.is('application/json')) throw new AppError(400, 'Se requiere contenido JSON.');
    }
    next();
  });
  app.post('/api/auth/login', async (req, res) => {
    const key = req.ip;
    for (const [ip, value] of intentos) if (value.hasta < Date.now()) intentos.delete(ip);
    const intento = intentos.get(key) || { cantidad: 0, hasta: Date.now() + 60000 };
    if (intento.cantidad >= 10) throw new AppError(429, 'Demasiados intentos. Espere un minuto.');
    intento.cantidad++; intentos.set(key, intento);
    const result = await authService.login(req.body?.correo, req.body?.contrasena);
    intentos.delete(key); authService.logout(token(req));
    res.cookie('sesion', result.token, cookie).json(result.usuario);
  });
  app.post('/api/auth/logout', (req, res) => {
    authService.logout(token(req)); res.clearCookie('sesion', { path: '/' }).json({ mensaje: 'Sesión cerrada.' });
  });
  app.use(async (req, res, next) => { req.usuario = await authService.autenticar(token(req)); next(); });
  app.use('/api', (req, res, next) => { if (!req.usuario) throw new AppError(401, 'Debe iniciar sesión.'); next(); });
  app.get('/api/auth/me', (req, res) => res.json(req.usuario));
  app.use('/api/usuarios', admin, require('./src/routes/usuarioRoutes')(usuarioService));
  app.use('/api/asistencia', require('./src/routes/asistenciaRoutes')(asistenciaService));
  app.use('/api/reportes', require('./src/routes/reporteRoutes')(reporteService));
  app.use('/api/configuracion', admin, require('./src/routes/configuracionRoutes')(configuracionService));
  app.get('/reportes.html', (req, res, next) => {
    if (!req.usuario) return res.redirect('/login.html');
    next();
  }, admin);
  app.get(['/', '/index.html', '/usuarios.html', '/asistencia.html'], (req, res, next) => {
    if (!req.usuario) return res.redirect('/login.html');
    if (req.usuario.rol !== 'ADMINISTRADOR' && req.path !== '/asistencia.html') return res.redirect('/asistencia.html');
    next();
  });
  app.use(express.static(path.join(__dirname, 'public')));
  app.use((req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'El cuerpo JSON no es válido.' });
    if (error.type === 'entity.too.large') return res.status(400).json({ mensaje: 'La solicitud es demasiado grande.' });
    const status = error instanceof AppError ? error.status : 500;
    if (status === 500) console.error(error);
    res.status(status).json({ mensaje: status === 500 ? 'No se pudo completar la operación. Revise la conexión con la base de datos.' : error.message });
  });
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const db = require('./src/config/database');
  const usuarios = new (require('./src/repositories/UsuarioRepository'))(db);
  const registros = new (require('./src/repositories/RegistroAsistenciaRepository'))(db);
  const configuracionService = new (require('./src/services/ConfiguracionService'))(new (require('./src/repositories/ConfiguracionRepository'))(db));
  const app = createApp({
    authService: new (require('./src/services/AuthService'))(usuarios),
    reporteService: new (require('./src/services/ReporteService'))(new (require('./src/repositories/ReporteRepository'))(db), usuarios),
    usuarioService: new (require('./src/services/UsuarioService'))(usuarios),
    asistenciaService: new (require('./src/services/AsistenciaService'))(registros, usuarios, undefined, configuracionService),
    configuracionService
  });
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
  const server = app.listen(port, host, () => console.log(`Sistema de asistencia: http://${host}:${port}`));
  server.on('error', () => { console.error('No se pudo iniciar el servidor. Revise el puerto configurado.'); process.exit(1); });
  db.query('SELECT 1').then(() => console.log('Conexión MySQL verificada.')).catch(err => console.error('MySQL no disponible. Configure .env e importe database/schema.sql para operar.', err));
  const cerrar = () => server.close(() => db.end().then(() => process.exit(0)));
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
}
module.exports = { createApp };
