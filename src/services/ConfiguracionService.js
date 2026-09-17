const AppError = require('../utils/AppError');
function esIpv4Valida(ip) {
  const partes = ip.split('.');
  return partes.length === 4 && partes.every(p => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}
class ConfiguracionService {
  constructor(repo) { this.repo = repo; }
  listarIpsPermitidas() { return this.repo.listarIps(); }
  async obtenerIpsPermitidas() { return (await this.repo.listarIps()).map(fila => fila.ip); }
  async agregarIpPermitida(valor) {
    const ip = typeof valor === 'string' ? valor.trim() : '';
    if (!ip || !esIpv4Valida(ip)) throw new AppError(400, 'Ingrese una dirección IPv4 válida (ej. 181.42.190.187).');
    await this.repo.agregarIp(ip);
    return this.listarIpsPermitidas();
  }
  async eliminarIpPermitida(idIp) {
    if (!/^[1-9]\d*$/.test(String(idIp))) throw new AppError(400, 'ID de IP inválido.');
    await this.repo.eliminarIp(Number(idIp));
    return this.listarIpsPermitidas();
  }
}
module.exports = ConfiguracionService;
