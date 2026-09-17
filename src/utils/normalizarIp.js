// Quita el prefijo IPv4-mapped (::ffff:) que Node agrega cuando el cliente llega por IPv4 detrás de un proxy.
module.exports = function normalizarIp(ip) {
  if (typeof ip !== 'string') return '';
  return ip.trim().replace(/^::ffff:/i, '');
};
