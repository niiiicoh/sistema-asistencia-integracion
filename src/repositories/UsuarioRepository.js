const Usuario = require('../models/Usuario');
class UsuarioRepository {
  constructor(db) { this.db = db; }
  map(row) { return row ? new Usuario({ idUsuario: row.id_usuario, nombre: row.nombre, apellido: row.apellido, correo: row.correo, contrasena: row.contrasena, rol: row.rol }, { permitirDatosHistoricos: true }) : null; }
  async listar() {
    const [rows] = await this.db.execute('SELECT id_usuario, nombre, apellido, correo, contrasena, rol FROM usuarios ORDER BY id_usuario DESC');
    return rows.map(row => this.map(row));
  }
  async buscarPorId(id) {
    const [rows] = await this.db.execute('SELECT id_usuario, nombre, apellido, correo, contrasena, rol FROM usuarios WHERE id_usuario = ?', [id]);
    return this.map(rows[0]);
  }
  async buscarPorCorreo(correo) {
    const [rows] = await this.db.execute('SELECT id_usuario, nombre, apellido, correo, contrasena, rol FROM usuarios WHERE correo = ?', [correo]);
    return this.map(rows[0]);
  }
  async crear(usuario) {
    const [result] = await this.db.execute('INSERT INTO usuarios (nombre, apellido, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?)', [usuario.nombre, usuario.apellido, usuario.correo, usuario.contrasena, usuario.rol]);
    usuario.idUsuario = result.insertId;
    return usuario;
  }
  async modificar(id, usuario) {
    const [result] = await this.db.execute('UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, contrasena = ?, rol = ? WHERE id_usuario = ?', [usuario.nombre, usuario.apellido, usuario.correo, usuario.contrasena, usuario.rol, id]);
    return result.affectedRows;
  }
  async eliminar(id) {
    const [result] = await this.db.execute('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    return result.affectedRows;
  }
}
module.exports = UsuarioRepository;
