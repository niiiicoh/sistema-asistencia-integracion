const { Router } = require('express');
module.exports = service => {
  const router = Router();
  const c = require('../controllers/usuarioController')(service);
  router.get('/', c.listar);
  router.get('/:id', c.obtener);
  router.post('/', c.crear);
  router.put('/:id', c.modificar);
  router.delete('/:id', c.eliminar);
  return router;
};
