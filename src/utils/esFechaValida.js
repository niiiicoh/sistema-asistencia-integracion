// Mismo dominio DATE y validación usados por las correcciones de asistencia.
module.exports = fecha => typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
  && fecha >= '1000-01-01' && fecha <= '9999-12-31'
  && Number.isFinite(Date.parse(fecha)) && new Date(fecha).toISOString().slice(0, 10) === fecha;
