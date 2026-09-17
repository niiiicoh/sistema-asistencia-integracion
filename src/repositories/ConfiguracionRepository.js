class ConfiguracionRepository {
  constructor(db) { this.db = db; }
  async listarIps() {
    const [rows] = await this.db.execute('SELECT id_ip AS idIp, ip, creado_en AS creadoEn FROM ips_permitidas ORDER BY creado_en, id_ip');
    return rows;
  }
  async agregarIp(ip) {
    await this.db.execute('INSERT IGNORE INTO ips_permitidas (ip) VALUES (?)', [ip]);
  }
  async eliminarIp(idIp) {
    await this.db.execute('DELETE FROM ips_permitidas WHERE id_ip = ?', [idIp]);
  }
}
module.exports = ConfiguracionRepository;
