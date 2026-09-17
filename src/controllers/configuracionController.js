const normalizarIp = require('../utils/normalizarIp');
module.exports = service => ({
  obtenerIp: async (req, res) => res.json({ ip: await service.obtenerIpPermitida(), ipActual: normalizarIp(req.ip) }),
  guardarIp: async (req, res) => res.json({ ip: await service.guardarIpPermitida(req.body?.ip) })
});
