const entrada = document.getElementById('entrada');
const salida = document.getElementById('salida');
const body = document.getElementById('registros');
const editorRegistro = document.getElementById('editor-registro');
let usuarioActual, editandoRegistro = null;
async function cargarRegistros() {
  entrada.disabled = salida.disabled = true;
  try {
    const registros = await api('/api/asistencia'); body.replaceChildren();
    const propias = registros.filter(r => Number(r.idUsuario) === Number(usuarioActual.idUsuario)).sort((a,b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`) || (BigInt(a.idRegistro) > BigInt(b.idRegistro) ? -1 : 1));
    const dentro = propias[0]?.tipoRegistro === 'ENTRADA';
    entrada.disabled = dentro; salida.disabled = !dentro;
    const estado = document.getElementById('estado-marca');
    estado.textContent = dentro ? 'Entrada registrada. Tu próxima marca es una salida.' : 'Sin entrada pendiente. Puedes registrar una entrada.';
    animarTexto(estado);
    if (usuarioActual.rol !== 'ADMINISTRADOR') pintarResumenSemana(propias);
    if (!registros.length) return tablaVacia(body, 'Aún no hay registros de asistencia.');
    let fechaAnterior = null;
    for (const registro of registros) {
      if (usuarioActual.rol !== 'ADMINISTRADOR' && registro.fecha !== fechaAnterior) {
        fechaAnterior = registro.fecha;
        const fila = body.insertRow(); fila.className = 'day-row';
        const celdaDia = fila.insertCell(); celdaDia.colSpan = 3;
        const fecha = new Date(`${registro.fecha}T00:00:00`);
        const texto = fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
        celdaDia.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
      }
      const row = body.insertRow(); celda(row, registro.usuario);
      const badge = document.createElement('span'); badge.className = `badge ${registro.tipoRegistro}`; badge.textContent = registro.tipoRegistro === 'ENTRADA' ? 'Entrada' : 'Salida'; celda(row, '').append(badge);
      celda(row, registro.fecha.split('-').reverse().join('/')); celda(row, registro.hora);
      if (usuarioActual.rol === 'ADMINISTRADOR') {
        const actions = celda(row, ''); const wrap = document.createElement('div'); wrap.className = 'actions'; actions.append(wrap);
        const editar = document.createElement('button'); editar.textContent = 'Editar'; editar.className = 'secondary';
        editar.onclick = () => {
          editandoRegistro = registro.idRegistro;
          document.getElementById('registro-persona').textContent = registro.usuario;
          document.getElementById('tipo-registro').value = registro.tipoRegistro;
          document.getElementById('fecha-registro').value = registro.fecha;
          document.getElementById('hora-registro').value = registro.hora;
          mostrarPanel(editorRegistro, true);
          document.getElementById('tipo-registro').focus();
        };
        const eliminar = document.createElement('button'); eliminar.textContent = 'Eliminar'; eliminar.className = 'danger';
        eliminar.onclick = async () => {
          if (!await confirmar(`¿Eliminar ${registro.tipoRegistro} de ${registro.usuario} del ${registro.fecha} a las ${registro.hora}?`)) return;
          eliminar.disabled = true;
          try { await api(`/api/asistencia/${registro.idRegistro}`, { method: 'DELETE' }); mostrarPanel(editorRegistro, false); mensaje('Registro eliminado.'); await cargarRegistros(); }
          catch (error) { mensaje(error.message, true); eliminar.disabled = false; }
        };
        wrap.append(editar, eliminar);
      }
    }
    animarTabla(body);
  } catch (error) { tablaVacia(body, 'No se pudieron cargar los registros. Recarga la página para reintentar.'); mensaje(error.message, true); }
}
function pintarResumenSemana(propias) {
  const hoy = new Date(); const inicioSemana = new Date(hoy); inicioSemana.setDate(inicioSemana.getDate() - 6);
  const desde = inicioSemana.toISOString().slice(0, 10);
  const semana = propias.filter(r => r.fecha >= desde).sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  const dias = new Set(semana.filter(r => r.tipoRegistro === 'ENTRADA').map(r => r.fecha));
  let minutos = 0, entradaPendiente = null;
  for (const r of semana) {
    if (r.tipoRegistro === 'ENTRADA') entradaPendiente = r;
    else if (entradaPendiente) { minutos += (new Date(`${r.fecha}T${r.hora}`) - new Date(`${entradaPendiente.fecha}T${entradaPendiente.hora}`)) / 60000; entradaPendiente = null; }
  }
  animarConteo(document.getElementById('stat-dias'), dias.size);
  animarConteo(document.getElementById('stat-horas'), Math.round(minutos / 60));
  dibujarGraficoSemana(document.getElementById('grafico-semana-empleado'), propias);
}
async function registrar(tipo) {
  entrada.disabled = salida.disabled = true;
  try {
    const registro = await api(`/api/asistencia/${tipo}`, { method: 'POST', body: '{}' });
    mensaje(`${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada el ${registro.fecha.split('-').reverse().join('/')} a las ${registro.hora}.`);
    const tarjeta = document.querySelector('.register');
    tarjeta.classList.remove('pulso-exito'); void tarjeta.offsetWidth; tarjeta.classList.add('pulso-exito');
  } catch (error) { mensaje(error.message, true); }
  finally { await cargarRegistros(); }
}
document.getElementById('cancelar-registro').onclick = () => { mostrarPanel(editorRegistro, false); editandoRegistro = null; };
document.getElementById('form-registro').onsubmit = async event => {
  event.preventDefault(); const boton = document.getElementById('guardar-registro'); boton.disabled = true;
  let hora = document.getElementById('hora-registro').value; if (hora.length === 5) hora += ':00';
  try {
    await api(`/api/asistencia/${editandoRegistro}`, { method: 'PUT', body: JSON.stringify({ tipoRegistro: document.getElementById('tipo-registro').value, fecha: document.getElementById('fecha-registro').value, hora }) });
    mostrarPanel(editorRegistro, false); mensaje('Registro actualizado.'); await cargarRegistros();
  } catch (error) { mensaje(error.message, true); }
  finally { boton.disabled = false; }
};
entrada.onclick = () => registrar('entrada'); salida.onclick = () => registrar('salida');
window.sesionLista.then(usuario => {
  if (!usuario) return; usuarioActual = usuario;
  const esAdmin = usuario.rol === 'ADMINISTRADOR';
  document.getElementById('titulo-registros').textContent = esAdmin ? 'Marcaciones de todos los usuarios' : 'Mis marcaciones';
  document.getElementById('titulo-pagina').textContent = esAdmin ? 'Control de asistencia' : `¡Hola, ${usuario.nombre || usuario.correo}!`;
  cargarRegistros();
});
