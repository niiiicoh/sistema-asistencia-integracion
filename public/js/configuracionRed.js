window.sesionLista.then(async usuario => {
  if (!usuario || usuario.rol !== 'ADMINISTRADOR') return;
  const input = document.getElementById('ip-permitida');
  const estado = document.getElementById('estado-ip');
  const boton = document.getElementById('guardar-ip');
  let ipActualDetectada = '';
  const describir = ip => ip ? `Restricción activa: solo se puede marcar desde ${ip}.` : 'Sin restricción de red: cualquiera puede marcar desde donde sea.';
  try {
    const datos = await api('/api/configuracion/ip-permitida');
    input.value = datos.ip || '';
    ipActualDetectada = datos.ipActual || '';
    estado.textContent = describir(datos.ip);
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
    boton.disabled = true;
    try {
      const datos = await api('/api/configuracion/ip-permitida', { method: 'PUT', body: JSON.stringify({ ip: input.value }) });
      input.value = datos.ip || '';
      estado.textContent = describir(datos.ip); animarTexto(estado);
      mensaje(datos.ip ? `Ahora solo se puede marcar asistencia desde ${datos.ip}.` : 'Restricción de red desactivada: ya no importa desde dónde se marque.');
    } catch (error) { mensaje(error.message, true); }
    finally { boton.disabled = false; }
  };
});
