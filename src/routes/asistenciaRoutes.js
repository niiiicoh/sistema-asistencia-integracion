const { Router } = require('express');
module.exports = service => {
  const router = Router();
  const c = require('../controllers/asistenciaController')(service);
  router.get('/', c.listar);
  router.get('/usuario/:id', c.porUsuario);
  router.post('/entrada', c.entrada);
  router.post('/salida', c.salida);
  router.put('/:id', require('../middleware/auth').admin, c.modificar);
  router.delete('/:id', require('../middleware/auth').admin, c.eliminar);
  return router;
};
