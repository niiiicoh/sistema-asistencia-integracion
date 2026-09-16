// Inicialización manual para instalaciones nuevas; nunca se ejecuta al arrancar.
const { randomBytes } = require('node:crypto');
const db = require('../src/config/database');
const UsuarioRepository = require('../src/repositories/UsuarioRepository');
const UsuarioService = require('../src/services/UsuarioService');
(async () => {
  const repo = new UsuarioRepository(db);
  if ((await repo.listar()).some(u => u.rol === 'ADMINISTRADOR')) {
    console.log('Ya existe un administrador. No se modificaron usuarios ni contraseñas.');
    return;
  }
  const contrasena = 'Adm!' + randomBytes(12).toString('base64url');
  const usuario = await new UsuarioService(repo).crear({ nombre: 'Administrador', apellido: 'Sistema', contrasena, rol: 'ADMINISTRADOR' });
  console.log(`Administrador creado.\nCorreo: ${usuario.correo}\nContraseña: ${contrasena}\nGuarda estas credenciales; la contraseña no se puede recuperar desde la base.`);
})().catch(() => { console.error('No se pudo crear el administrador. Revise la base de datos.'); process.exitCode = 1; }).finally(() => db.end());
