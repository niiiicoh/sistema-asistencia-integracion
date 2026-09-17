const body = document.getElementById('historial');
window.sesionLista.then(async usuario => {
  if (!usuario) return;
  try {
    const registros = await api('/api/asistencia');
    body.replaceChildren();
    if (!registros.length) return tablaVacia(body, 'Aún no tienes marcaciones registradas.');
    let fechaAnterior = null;
    for (const registro of registros) {
      if (registro.fecha !== fechaAnterior) {
        fechaAnterior = registro.fecha;
        const fila = body.insertRow(); fila.className = 'day-row';
        const celdaDia = fila.insertCell(); celdaDia.colSpan = 3;
        const fecha = new Date(`${registro.fecha}T00:00:00`);
        const texto = fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
        celdaDia.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
      }
      const row = body.insertRow();
      const badge = document.createElement('span'); badge.className = `badge ${registro.tipoRegistro}`; badge.textContent = registro.tipoRegistro === 'ENTRADA' ? 'Entrada' : 'Salida'; celda(row, '').append(badge);
      celda(row, registro.fecha.split('-').reverse().join('/')); celda(row, registro.hora);
    }
    animarTabla(body);
  } catch (error) { tablaVacia(body, 'No se pudo cargar el historial. Recarga la página para reintentar.'); mensaje(error.message, true); }
});
