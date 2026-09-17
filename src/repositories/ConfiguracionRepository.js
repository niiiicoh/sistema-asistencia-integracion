class ConfiguracionRepository {
  constructor(db) { this.db = db; }
  async obtener(clave) {
    const [rows] = await this.db.execute('SELECT valor FROM configuracion WHERE clave = ?', [clave]);
    return rows[0]?.valor ?? null;
  }
  async guardar(clave, valor) {
    await this.db.execute('INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)', [clave, valor]);
  }
}
module.exports = ConfiguracionRepository;
