const { Router } = require('express');
const { admin } = require('../middleware/auth');
module.exports = service => {
  const router = Router();
  const c = require('../controllers/reporteController')(service);
  router.use(admin);
  router.get('/atrasos', c.atrasos);
  router.get('/salidas-anticipadas', c.salidasAnticipadas);
  router.get('/inasistencias', c.inasistencias);
  return router;
};
