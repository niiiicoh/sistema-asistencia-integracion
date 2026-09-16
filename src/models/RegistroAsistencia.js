const AppError = require('../utils/AppError');
const validarId = require('../utils/validarId');
class RegistroAsistencia {
  constructor({ idRegistro = null, idUsuario, tipoRegistro, fecha, hora }) {
    idUsuario = validarId(idUsuario);
    if (!['ENTRADA', 'SALIDA'].includes(tipoRegistro)) throw new AppError(400, 'Tipo de registro inválido.');
    Object.assign(this, { idRegistro, idUsuario, tipoRegistro, fecha, hora });
  }
}
module.exports = RegistroAsistencia;
