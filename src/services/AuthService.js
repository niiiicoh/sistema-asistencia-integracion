const { randomBytes, timingSafeEqual, scrypt } = require('node:crypto');
const { promisify } = require('node:util');
const AppError = require('../utils/AppError');
const derive = promisify(scrypt);
class AuthService {
  constructor(usuarios) { this.usuarios = usuarios; this.sesiones = new Map(); }
  async login(correo, contrasena) {
    if (typeof correo !== 'string' || typeof contrasena !== 'string' || contrasena.length > 255) throw new AppError(400, 'Ingrese correo y contraseña.');
    const usuario = await this.usuarios.buscarPorCorreo(correo.trim().toLowerCase());
    const [, salt, expected] = (usuario?.contrasena || '').split(':');
    // Derivar incluso para usuarios desconocidos reduce diferencias de tiempo.
    const actual = await derive(contrasena, salt || '00000000000000000000000000000000', 64);
    if (!expected || expected.length !== 128 || !timingSafeEqual(actual, Buffer.from(expected, 'hex'))) throw new AppError(401, 'Correo o contraseña incorrectos.');
    for (const [token, sesion] of this.sesiones) if (sesion.vence <= Date.now()) this.sesiones.delete(token);
    const token = randomBytes(32).toString('hex');
    this.sesiones.set(token, { id: usuario.idUsuario, hash: usuario.contrasena, vence: Date.now() + 8 * 60 * 60 * 1000 });
    return { token, usuario };
  }
  async autenticar(token) {
    const sesion = this.sesiones.get(token);
    if (!sesion) return null;
    if (sesion.vence <= Date.now()) { this.sesiones.delete(token); return null; }
    const usuario = await this.usuarios.buscarPorId(sesion.id);
    if (!usuario || usuario.contrasena !== sesion.hash) { this.sesiones.delete(token); return null; }
    return usuario;
  }
  logout(token) { this.sesiones.delete(token); }
}
module.exports = AuthService;
