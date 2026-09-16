const AppError = require('../utils/AppError');
module.exports = service => ({
  entrada: async (req, res) => res.status(201).json(await service.registrarEntrada(req.usuario.idUsuario)),
  salida: async (req, res) => res.status(201).json(await service.registrarSalida(req.usuario.idUsuario)),
  listar: async (req, res) => res.json(await (req.usuario.rol === 'ADMINISTRADOR' ? service.listarTodos() : service.listarPorUsuario(req.usuario.idUsuario))),
  porUsuario: async (req, res) => {
    if (req.usuario.rol !== 'ADMINISTRADOR' && String(req.usuario.idUsuario) !== req.params.id) throw new AppError(403, 'Solo puede ver sus propias marcaciones.');
    res.json(await service.listarPorUsuario(req.params.id));
  },
  modificar: async (req, res) => res.json(await service.modificar(req.params.id, req.body || {})),
  eliminar: async (req, res) => { await service.eliminar(req.params.id); res.json({ mensaje: 'Registro eliminado.' }); }
});
