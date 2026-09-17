const { Router } = require('express');
module.exports = service => {
  const router = Router();
  const c = require('../controllers/configuracionController')(service);
  router.get('/ip-permitida', c.obtenerIp);
  router.put('/ip-permitida', c.guardarIp);
  return router;
};
