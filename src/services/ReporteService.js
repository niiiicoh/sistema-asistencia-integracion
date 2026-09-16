const AppError = require('../utils/AppError');
const validarId = require('../utils/validarId');
const esFechaValida = require('../utils/esFechaValida');
class ReporteService {
  constructor(reportes, usuarios) { this.reportes = reportes; this.usuarios = usuarios; }
  async validarFiltros({ desde, hasta, idUsuario } = {}) {
    if (!esFechaValida(desde) || !esFechaValida(hasta)) throw new AppError(400, 'Indique desde y hasta con fechas válidas en formato YYYY-MM-DD.');
    if (desde > hasta) throw new AppError(400, 'La fecha desde no puede ser posterior a la fecha hasta.');
    if (idUsuario !== undefined) {
      idUsuario = validarId(idUsuario);
      const usuario = await this.usuarios.buscarPorId(idUsuario);
      if (!usuario) throw new AppError(404, 'El empleado indicado no existe.');
      if (usuario.rol !== 'EMPLEADO') throw new AppError(400, 'El filtro debe corresponder a un empleado.');
    }
    return { desde, hasta, idUsuario };
  }
  async atrasos(filtros) { return this.reportes.atrasos(await this.validarFiltros(filtros)); }
  async salidasAnticipadas(filtros) { return this.reportes.salidasAnticipadas(await this.validarFiltros(filtros)); }
  async inasistencias(filtros) { return this.reportes.inasistencias(await this.validarFiltros(filtros)); }
}
module.exports = ReporteService;
