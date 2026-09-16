// Repositorio en memoria para aislar servicios y rutas HTTP de MySQL.
// Las consultas SQL reales se verifican además con tablas temporales en el script de integración.
function memoriaReportes(usuarios, registros) {
  const identidad = u => ({ idUsuario: u.idUsuario, nombre: u.nombre, apellido: u.apellido, correo: u.correo });
  const ordenar = filas => filas.sort((a, b) => b.fecha.localeCompare(a.fecha) || (a.nombre || '').localeCompare(b.nombre || '') || a.idUsuario - b.idUsuario);
  async function marcas(f, tipo, acepta) {
    const us = await usuarios();
    return ordenar((await registros()).filter(r => r.tipoRegistro === tipo && acepta(r.hora) && r.fecha >= f.desde && r.fecha <= f.hasta && (f.idUsuario === undefined || r.idUsuario === f.idUsuario))
      .map(r => ({ ...identidad(us.find(u => u.idUsuario === r.idUsuario)), fecha: r.fecha, hora: r.hora })));
  }
  return {
    atrasos: f => marcas(f, 'ENTRADA', hora => hora > '09:30:00'),
    salidasAnticipadas: f => marcas(f, 'SALIDA', hora => hora < '17:30:00'),
    inasistencias: async f => {
      const us = (await usuarios()).filter(u => u.rol === 'EMPLEADO' && (f.idUsuario === undefined || u.idUsuario === f.idUsuario));
      const rs = await registros(); const filas = [];
      for (let d = new Date(f.desde); d <= new Date(f.hasta); d.setUTCDate(d.getUTCDate() + 1)) {
        const fecha = d.toISOString().slice(0, 10);
        for (const u of us) if (!rs.some(r => r.idUsuario === u.idUsuario && r.fecha === fecha)) filas.push({ ...identidad(u), fecha });
      }
      return ordenar(filas);
    }
  };
}
module.exports = memoriaReportes;
