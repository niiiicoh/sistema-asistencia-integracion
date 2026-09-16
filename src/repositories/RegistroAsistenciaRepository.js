const selection = `SELECT r.id_registro AS idRegistro, r.id_usuario AS idUsuario,
  u.correo AS usuario, r.tipo_registro AS tipoRegistro, r.fecha, r.hora
  FROM registros_asistencia r JOIN usuarios u ON u.id_usuario = r.id_usuario`;
class RegistroAsistenciaRepository {
  constructor(db) { this.db = db; }
  async conUsuarioBloqueado(idUsuario, operacion) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const [usuarios] = await connection.execute('SELECT id_usuario FROM usuarios WHERE id_usuario = ? FOR UPDATE', [idUsuario]);
      if (!usuarios.length) throw new (require('../utils/AppError'))(404, 'El usuario no existe.');
      const result = await operacion(new RegistroAsistenciaRepository(connection));
      await connection.commit();
      return result;
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  }
  async buscarPorId(id) {
    const [rows] = await this.db.execute(selection + ' WHERE r.id_registro = ?', [id]);
    return rows[0] || null;
  }
  async modificar(id, registro) {
    await this.db.execute('UPDATE registros_asistencia SET tipo_registro = ?, fecha = ?, hora = ? WHERE id_registro = ?', [registro.tipoRegistro, registro.fecha, registro.hora, id]);
    return this.buscarPorId(id);
  }
  async eliminar(id) { await this.db.execute('DELETE FROM registros_asistencia WHERE id_registro = ?', [id]); }
  async registrar(registro) {
    const [result] = await this.db.execute('INSERT INTO registros_asistencia (id_usuario, tipo_registro, fecha, hora) VALUES (?, ?, ?, ?)', [registro.idUsuario, registro.tipoRegistro, registro.fecha, registro.hora]);
    registro.idRegistro = result.insertId;
    return registro;
  }
  async listarTodos() {
    const [rows] = await this.db.execute(selection + ' ORDER BY r.id_registro DESC');
    return rows;
  }
  async listarPorUsuario(idUsuario) {
    const [rows] = await this.db.execute(selection + ' WHERE r.id_usuario = ? ORDER BY r.id_registro DESC', [idUsuario]);
    return rows;
  }
}
module.exports = RegistroAsistenciaRepository;
