const identidad = 'u.id_usuario AS idUsuario, u.nombre, u.apellido, u.correo';
class ReporteRepository {
  constructor(db) { this.db = db; }
  async marcas({ desde, hasta, idUsuario }, tipo, limite, operador) {
    // El operador es una constante interna de los dos métodos públicos, nunca un filtro HTTP.
    const sql = `SELECT ${identidad}, r.fecha, r.hora
      FROM registros_asistencia r JOIN usuarios u ON u.id_usuario = r.id_usuario
      WHERE r.tipo_registro = ? AND r.hora ${operador} ? AND r.fecha BETWEEN ? AND ?
      ${idUsuario === undefined ? '' : 'AND u.id_usuario = ?'}
      ORDER BY r.fecha DESC, u.nombre, u.apellido, u.id_usuario, r.hora, r.id_registro`;
    const params = [tipo, limite, desde, hasta];
    if (idUsuario !== undefined) params.push(idUsuario);
    const [rows] = await this.db.execute(sql, params);
    return rows;
  }
  atrasos(filtros) { return this.marcas(filtros, 'ENTRADA', '09:30:00', '>'); }
  salidasAnticipadas(filtros) { return this.marcas(filtros, 'SALIDA', '17:30:00', '<'); }
  async inasistencias({ desde, hasta, idUsuario }) {
    const resultado = [];
    let cursor = new Date(`${hasta}T00:00:00Z`);
    const inicio = new Date(`${desde}T00:00:00Z`);
    // Lotes internos de fechas evitan el límite de recursión SQL. No limitan el rango solicitado.
    while (cursor >= inicio) {
      const fechas = [];
      while (fechas.length < 500 && cursor >= inicio) {
        fechas.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      const calendario = fechas.map(() => 'SELECT CAST(? AS DATE) AS fecha').join(' UNION ALL ');
      const params = [...fechas, 'EMPLEADO'];
      if (idUsuario !== undefined) params.push(idUsuario);
      const [rows] = await this.db.execute(`SELECT ${identidad}, dias.fecha
        FROM usuarios u CROSS JOIN (${calendario}) dias
        WHERE u.rol = ? ${idUsuario === undefined ? '' : 'AND u.id_usuario = ?'}
          AND NOT EXISTS (SELECT 1 FROM registros_asistencia r
            WHERE r.id_usuario = u.id_usuario AND r.fecha = dias.fecha)
        ORDER BY dias.fecha DESC, u.nombre, u.apellido, u.id_usuario`, params);
      resultado.push(...rows);
    }
    return resultado;
  }
}
module.exports = ReporteRepository;
