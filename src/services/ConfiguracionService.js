const AppError = require('../utils/AppError');
const CLAVE_IP_ASISTENCIA = 'ip_permitida_asistencia';
class ConfiguracionService {
  constructor(repo) { this.repo = repo; }
  obtenerIpPermitida() { return this.repo.obtener(CLAVE_IP_ASISTENCIA); }
  async guardarIpPermitida(valor) {
    const ip = typeof valor === 'string' ? valor.trim() : '';
    if (ip) {
      const partes = ip.split('.');
      const valida = partes.length === 4 && partes.every(p => /^\d{1,3}$/.test(p) && Number(p) <= 255);
      if (!valida) throw new AppError(400, 'Ingrese una dirección IPv4 válida (ej. 181.42.190.187) o déjelo vacío para no restringir.');
    }
    await this.repo.guardar(CLAVE_IP_ASISTENCIA, ip || null);
    return ip || null;
  }
}
module.exports = ConfiguracionService;
