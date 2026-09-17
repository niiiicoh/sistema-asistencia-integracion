const normalizarIp = require('../utils/normalizarIp');
module.exports = service => ({
  listarIps: async (req, res) => res.json({ ips: await service.listarIpsPermitidas(), ipActual: normalizarIp(req.ip) }),
  agregarIp: async (req, res) => res.status(201).json({ ips: await service.agregarIpPermitida(req.body?.ip) }),
  eliminarIp: async (req, res) => res.json({ ips: await service.eliminarIpPermitida(req.params.idIp) })
});
