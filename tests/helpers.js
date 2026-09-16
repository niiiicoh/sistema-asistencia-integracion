const Usuario = require('../src/models/Usuario');
const UsuarioService = require('../src/services/UsuarioService');
const AsistenciaService = require('../src/services/AsistenciaService');
const AuthService = require('../src/services/AuthService');
const hash = require('../src/utils/password');
const { createApp } = require('../app');
async function fixture() {
  const password = await hash('clave-prueba');
  const usuarios = [new Usuario({ idUsuario: 1, nombre: 'Admin', apellido: 'Sistema', correo: 'admin.sistema@empresa.cl', contrasena: password, rol: 'ADMINISTRADOR' }),
    new Usuario({ idUsuario: 2, nombre: 'Ana', apellido: 'Pérez', correo: 'ana.perez@empresa.cl', contrasena: password, rol: 'EMPLEADO' }),
    new Usuario({ idUsuario: 3, nombre: 'Luis', apellido: 'Soto', correo: 'luis.soto@empresa.cl', contrasena: password, rol: 'EMPLEADO' })];
  let nextUser = 4, nextRegistro = 1; const registros = [];
  const ur = {
    listar: async () => usuarios,
    buscarPorId: async id => usuarios.find(u => u.idUsuario === Number(id)),
    buscarPorCorreo: async correo => usuarios.find(u => u.correo === correo),
    crear: async u => { u.idUsuario = nextUser++; usuarios.push(u); return u; },
    modificar: async (id, u) => { const i = usuarios.findIndex(u => u.idUsuario === id); if (i < 0) return 0; usuarios[i] = u; return 1; },
    eliminar: async id => { if (registros.some(r => r.idUsuario === id)) throw { code: 'ER_ROW_IS_REFERENCED_2' }; const i = usuarios.findIndex(u => u.idUsuario === id); if (i < 0) return 0; usuarios.splice(i, 1); return 1; }
  };
  const rr = {
    conUsuarioBloqueado: async (id, fn) => fn(rr),
    registrar: async r => { const row = { ...r, idRegistro: nextRegistro++, usuario: (await ur.buscarPorId(r.idUsuario)).correo }; registros.push(row); return row; },
    listarTodos: async () => [...registros].reverse(),
    listarPorUsuario: async id => registros.filter(r => r.idUsuario === Number(id)).reverse(),
    buscarPorId: async id => registros.find(r => String(r.idRegistro) === String(id)),
    modificar: async (id, r) => { const i = registros.findIndex(r => String(r.idRegistro) === String(id)); registros[i] = r; return r; },
    eliminar: async id => { registros.splice(registros.findIndex(r => String(r.idRegistro) === String(id)), 1); }
  };
  const usuarioService = new UsuarioService(ur);
  const asistenciaService = new AsistenciaService(rr, ur, () => new Date(2026, 8, 9, 8, 5, 3));
  const authService = new AuthService(ur);
  return { app: createApp({ usuarioService, asistenciaService, authService }), usuarioService, asistenciaService, authService, ur, rr, registros };
}
module.exports = fixture;
