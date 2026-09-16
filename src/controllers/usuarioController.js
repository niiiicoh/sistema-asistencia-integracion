module.exports = service => ({
  listar: async (req, res) => res.json(await service.listar()),
  obtener: async (req, res) => res.json(await service.buscarPorId(req.params.id)),
  crear: async (req, res) => res.status(201).json(await service.crear(req.body || {})),
  modificar: async (req, res) => res.json(await service.modificar(req.params.id, req.body || {})),
  eliminar: async (req, res) => { await service.eliminar(req.params.id); res.json({ mensaje: 'Usuario eliminado correctamente.' }); }
});
