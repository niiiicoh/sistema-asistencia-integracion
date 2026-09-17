const { Router } = require('express');
module.exports = service => {
  const router = Router();
  const c = require('../controllers/configuracionController')(service);
  router.get('/ips-permitidas', c.listarIps);
  router.post('/ips-permitidas', c.agregarIp);
  router.delete('/ips-permitidas/:idIp', c.eliminarIp);
  return router;
};
