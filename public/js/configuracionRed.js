window.sesionLista.then(async usuario => {
  if (!usuario || usuario.rol !== 'ADMINISTRADOR') return;
  const input = document.getElementById('ip-nueva');
  const estado = document.getElementById('estado-ip');
  const boton = document.getElementById('agregar-ip');
  const cuerpo = document.getElementById('lista-ips');
  let ipActualDetectada = '';
  const describir = ips => ips.length
    ? `Restricción activa: se puede marcar desde ${ips.length} IP${ips.length > 1 ? 's' : ''} permitida${ips.length > 1 ? 's' : ''}.`
    : 'Sin restricción de red: cualquiera puede marcar desde donde sea.';
  const formatearFecha = iso => new Date(iso).toLocaleString('es-CL');
  function pintar(ips) {
    estado.textContent = describir(ips);
    cuerpo.replaceChildren();
    if (!ips.length) { tablaVacia(cuerpo, 'No hay IPs permitidas.'); return; }
    for (const fila of ips) {
      const row = cuerpo.insertRow();
      celda(row, fila.ip);
      celda(row, formatearFecha(fila.creadoEn));
      const accion = celda(row, '');
      const eliminar = document.createElement('button'); eliminar.type = 'button'; eliminar.textContent = 'Eliminar'; eliminar.className = 'danger';
      eliminar.onclick = async () => {
        if (!await confirmar(`¿Eliminar la IP ${fila.ip} de la lista de permitidas?`)) return;
        eliminar.disabled = true;
        try { const datos = await api(`/api/configuracion/ips-permitidas/${fila.idIp}`, { method: 'DELETE' }); pintar(datos.ips); mensaje('IP eliminada.'); }
        catch (error) { mensaje(error.message, true); eliminar.disabled = false; }
      };
      accion.append(eliminar);
    }
    animarTabla(cuerpo);
  }
  try {
    const datos = await api('/api/configuracion/ips-permitidas');
    ipActualDetectada = datos.ipActual || '';
    pintar(datos.ips);
  } catch (error) { estado.textContent = 'No se pudo cargar la configuración.'; mensaje(error.message, true); }
  const botonIpActual = document.getElementById('usar-ip-actual');
  botonIpActual.onclick = async () => {
    botonIpActual.disabled = true;
    try {
      const respuesta = await fetch('https://ipv4.icanhazip.com');
      input.value = (await respuesta.text()).trim();
    } catch { input.value = ipActualDetectada; }
    finally { botonIpActual.disabled = false; input.focus(); }
  };
  boton.onclick = async () => {
    const ipAgregada = input.value.trim();
    boton.disabled = true;
    try {
      const datos = await api('/api/configuracion/ips-permitidas', { method: 'POST', body: JSON.stringify({ ip: ipAgregada }) });
      pintar(datos.ips); animarTexto(estado);
      mensaje(`IP ${ipAgregada} agregada.`);
      input.value = '';
    } catch (error) { mensaje(error.message, true); }
    finally { boton.disabled = false; input.focus(); }
  };
});
