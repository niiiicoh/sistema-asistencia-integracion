function animarReloj() {
  const ahora = new Date();
  const gradosHora = (ahora.getHours() % 12 + ahora.getMinutes() / 60) * 30;
  const gradosMinuto = ahora.getMinutes() * 6;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const hora = document.querySelector('.hand-hora'); const minuto = document.querySelector('.hand-minuto');
    if (hora) hora.style.transform = `rotate(${gradosHora}deg)`;
    if (minuto) minuto.style.transform = `rotate(${gradosMinuto}deg)`;
  }));
}
async function cargarResumen() {
  try {
    const [usuarios, registros] = await Promise.all([api('/api/usuarios'), api('/api/asistencia')]);
    const hoy = new Date().toISOString().slice(0, 10);
    document.getElementById('stat-empleados').textContent = usuarios.filter(u => u.rol === 'EMPLEADO').length;
    const deHoy = registros.filter(r => r.fecha === hoy);
    document.getElementById('stat-marcaciones').textContent = deHoy.length;
    document.getElementById('stat-atrasos').textContent = deHoy.filter(r => r.tipoRegistro === 'ENTRADA' && r.hora > '09:30:00').length;
  } catch { /* Si falla, las tarjetas quedan con el guion inicial. */ }
}
animarReloj();
window.sesionLista.then(usuario => {
  if (!usuario) return;
  document.getElementById('titulo-pagina').textContent = `¡Hola, ${usuario.nombre || usuario.correo}!`;
  cargarResumen();
});
