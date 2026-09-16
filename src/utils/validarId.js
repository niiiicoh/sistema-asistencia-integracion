const AppError = require('./AppError');
module.exports = function validarId(value) {
  if (!['number', 'string'].includes(typeof value) || !/^[1-9]\d*$/.test(String(value)) || Number(value) > 4294967295) {
    throw new AppError(400, 'El ID de usuario debe ser un entero positivo válido.');
  }
  return Number(value);
};
