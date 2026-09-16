module.exports = service => ({
  atrasos: async (req, res) => res.json(await service.atrasos(req.query)),
  salidasAnticipadas: async (req, res) => res.json(await service.salidasAnticipadas(req.query)),
  inasistencias: async (req, res) => res.json(await service.inasistencias(req.query))
});
