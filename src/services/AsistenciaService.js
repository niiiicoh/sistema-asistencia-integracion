const RegistroAsistencia = require('../models/RegistroAsistencia');
const AppError = require('../utils/AppError');
const validarId = require('../utils/validarId');
const esFechaValida = require('../utils/esFechaValida');
class AsistenciaService {
  constructor(registros, usuarios, reloj = () => new Date()) { this.registros = registros; this.usuarios = usuarios; this.reloj = reloj; }
  async validarUsuario(id) {
    id = validarId(id);
    if (!await this.usuarios.buscarPorId(id)) throw new AppError(404, 'El usuario no existe.');
    return id;
  }
  async registrar(idUsuario, tipoRegistro) {
    idUsuario = await this.validarUsuario(idUsuario);
    // Una única lectura del reloj local del servidor evita mezclar días al llegar a medianoche.
    const ahora = this.reloj();
    const pad = value => String(value).padStart(2, '0');
    const fecha = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;
    const hora = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
    try {
      return await this.registros.conUsuarioBloqueado(idUsuario, async repo => {
        const registro = new RegistroAsistencia({ idUsuario, tipoRegistro, fecha, hora });
        this.validarSecuencia([...(await repo.listarPorUsuario(idUsuario)), { ...registro, idRegistro: '18446744073709551615' }]);
        return repo.registrar(registro);
      });
    }
    catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2') throw new AppError(404, 'El usuario ya no existe.');
      throw error;
    }
  }
  registrarEntrada(id) { return this.registrar(id, 'ENTRADA'); }
  registrarSalida(id) { return this.registrar(id, 'SALIDA'); }
  listarTodos() { return this.registros.listarTodos(); }
  async listarPorUsuario(id) { return this.registros.listarPorUsuario(await this.validarUsuario(id)); }
  validarSecuencia(registros) {
    const ordenados = [...registros].sort((a, b) => {
      const tiempo = `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`);
      return tiempo || (BigInt(a.idRegistro) < BigInt(b.idRegistro) ? -1 : 1);
    });
    let esperado = 'ENTRADA';
    for (const r of ordenados) {
      if (r.tipoRegistro !== esperado) throw new AppError(409, esperado === 'ENTRADA'
        ? 'No se puede registrar una salida sin una entrada anterior. La secuencia debe alternar entrada y salida.'
        : 'Ya existe una entrada sin salida. La secuencia debe alternar entrada y salida.');
      esperado = esperado === 'ENTRADA' ? 'SALIDA' : 'ENTRADA';
    }
  }
  validarRegistroId(id) {
    if (typeof id !== 'string' || !/^[1-9]\d{0,19}$/.test(id) || BigInt(id) > 18446744073709551615n) throw new AppError(400, 'ID de registro inválido.');
    return id;
  }
  async corregir(id, datos, eliminar = false) {
    id = this.validarRegistroId(id);
    const original = await this.registros.buscarPorId(id);
    if (!original) throw new AppError(404, 'El registro no existe.');
    return this.registros.conUsuarioBloqueado(original.idUsuario, async repo => {
      const actual = await repo.buscarPorId(id);
      if (!actual) throw new AppError(404, 'El registro no existe.');
      const registros = (await repo.listarPorUsuario(actual.idUsuario)).filter(r => String(r.idRegistro) !== id);
      if (eliminar) { this.validarSecuencia(registros); await repo.eliminar(id); return; }
      const { tipoRegistro, fecha, hora } = datos;
      if (!['ENTRADA', 'SALIDA'].includes(tipoRegistro) || !esFechaValida(fecha)
        || typeof hora !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(hora)) throw new AppError(400, 'Ingrese un tipo, una fecha y una hora válidos.');
      const nuevo = { ...actual, tipoRegistro, fecha, hora };
      this.validarSecuencia([...registros, nuevo]);
      return repo.modificar(id, nuevo);
    });
  }
  modificar(id, datos) { return this.corregir(id, datos); }
  eliminar(id) { return this.corregir(id, {}, true); }
}
module.exports = AsistenciaService;
