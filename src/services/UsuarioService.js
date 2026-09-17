const Usuario = require('../models/Usuario');
const AppError = require('../utils/AppError');
const validarId = require('../utils/validarId');
const hashPassword = require('../utils/password');
class UsuarioService {
  constructor(repository, hash = hashPassword, registros = null) { this.repository = repository; this.hash = hash; this.registros = registros; }
  listar() { return this.repository.listar(); }
  async buscarPorId(id) {
    const usuario = await this.repository.buscarPorId(validarId(id));
    if (!usuario) throw new AppError(404, 'El usuario no existe.');
    return usuario;
  }
  async validarCorreo(usuario, id = null) {
    const existente = await this.repository.buscarPorCorreo(usuario.correo);
    if (existente && existente.idUsuario !== id) throw new AppError(409, 'Ya existe un usuario con ese correo.');
  }
  async guardar(operation) {
    try { return await operation(); }
    catch (error) {
      if (error.code === 'ER_DUP_ENTRY') throw new AppError(409, 'Ya existe un usuario con ese correo.');
      throw error;
    }
  }
  async crear(datos) {
    const usuario = new Usuario({ ...datos, correo: require('../utils/correoEmpresa')(datos.nombre, datos.apellido) });
    usuario.contrasena = await this.hash(usuario.contrasena);
    const base = usuario.correo.split('@')[0];
    for (let numero = 1; numero <= 100; numero++) {
      usuario.correo = `${base}${numero === 1 ? '' : numero}@empresa.cl`;
      if (await this.repository.buscarPorCorreo(usuario.correo)) continue;
      try { return await this.repository.crear(usuario); }
      catch (error) { if (error.code !== 'ER_DUP_ENTRY') throw error; }
    }
    throw new AppError(409, 'No se pudo asignar un correo disponible para este nombre.');
  }
  async modificar(id, datos) {
    const actual = await this.buscarPorId(id);
    const usuario = new Usuario({ idUsuario: actual.idUsuario,
      nombre: datos.nombre === undefined ? actual.nombre : datos.nombre,
      apellido: datos.apellido === undefined ? actual.apellido : datos.apellido,
      correo: actual.correo,
      contrasena: datos.contrasena === undefined ? actual.contrasena : datos.contrasena, rol: datos.rol === undefined ? actual.rol : datos.rol });
    await this.validarCorreo(usuario, actual.idUsuario);
    if (datos.contrasena !== undefined) usuario.contrasena = await this.hash(usuario.contrasena);
    await this.guardar(async () => {
      if (!await this.repository.modificar(actual.idUsuario, usuario)) throw new AppError(404, 'El usuario no existe.');
    });
    return usuario;
  }
  async eliminar(id, forzar = false) {
    const usuario = await this.buscarPorId(id);
    try {
      if (forzar) await this.registros.eliminarPorUsuario(usuario.idUsuario);
      if (!await this.repository.eliminar(usuario.idUsuario)) throw new AppError(404, 'El usuario no existe.');
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') throw new AppError(409, 'No se puede eliminar el usuario porque tiene registros de asistencia asociados.');
      throw error;
    }
  }
}
module.exports = UsuarioService;
