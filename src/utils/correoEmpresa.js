const AppError = require('./AppError');
module.exports = function correoEmpresa(nombre, apellido) {
  const parte = value => typeof value === 'string' ? value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '').replace(/\.+/g, '.').replace(/^\.|\.$/g, '') : '';
  const base = `${parte(nombre)}.${parte(apellido)}`;
  if (!parte(nombre) || !parte(apellido)) throw new AppError(400, 'Nombre y apellido deben permitir generar un correo válido.');
  return `${base.slice(0, 125)}@empresa.cl`;
};
