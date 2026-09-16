const AppError = require('../utils/AppError');
function token(req) { return (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('sesion='))?.slice(7); }
function admin(req, res, next) {
  if (req.usuario?.rol !== 'ADMINISTRADOR') throw new AppError(403, 'Esta acción requiere permisos de administrador.');
  next();
}
module.exports = { token, admin };
