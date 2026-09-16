const formulario = document.getElementById('filtros-reportes');
const tipo = document.getElementById('tipo-reporte');
const empleado = document.getElementById('empleado');
const desde = document.getElementById('desde');
const hasta = document.getElementById('hasta');
const generar = document.getElementById('generar');
const resultados = document.getElementById('resultados');
const contador = document.getElementById('contador');
const hora = document.getElementById('columna-hora');
const opciones = {
  atrasos: ['Atrasos', 'Hora de entrada', 'Entradas posteriores a las 09:30:00. Las entradas a las 09:30:00 exactas no son atrasos.'],
  'salidas-anticipadas': ['Salidas anticipadas', 'Hora de salida', 'Salidas anteriores a las 17:30:00. Las salidas a las 17:30:00 exactas no son anticipadas.'],
  inasistencias: ['Inasistencias', '', 'Empleados sin ninguna marcación en cada fecha consultada. Se incluyen todos los días: no se descuentan feriados ni fines de semana, no se consideran permisos o vacaciones y no existe todavía un calendario laboral.']
};
function vaciar(texto) {
  tablaVacia(resultados, texto);
  resultados.rows[0].cells[0].colSpan = tipo.value === 'inasistencias' ? 5 : 6;
}
formulario.onchange = () => {
  const [titulo, columna, regla] = opciones[tipo.value];
  document.getElementById('titulo-resultados').textContent = titulo;
  document.getElementById('regla-reporte').textContent = regla;
  hora.textContent = columna; hora.hidden = !columna;
  contador.textContent = 'Sin consulta';
  document.getElementById('mensaje').hidden = true;
  vaciar('Genera el reporte con los filtros seleccionados.');
};
formulario.onsubmit = async event => {
  event.preventDefault();
  if (desde.value > hasta.value) { mensaje('La fecha desde no puede ser posterior a la fecha hasta.', true); return; }
  const seleccion = tipo.value;
  const params = new URLSearchParams({ desde: desde.value, hasta: hasta.value });
  if (empleado.value) params.set('idUsuario', empleado.value);
  const controles = [...formulario.elements]; controles.forEach(c => { c.disabled = true; });
  document.getElementById('mensaje').hidden = true;
  contador.textContent = 'Consultando…'; vaciar('Consultando registros…');
  try {
    const filas = await api(`/api/reportes/${seleccion}?${params}`);
    contador.textContent = `${filas.length} resultado${filas.length === 1 ? '' : 's'}`;
    resultados.replaceChildren();
    if (!filas.length) return vaciar('No existen resultados para los filtros seleccionados.');
    for (const fila of filas) {
      const row = resultados.insertRow();
      celda(row, fila.idUsuario); celda(row, fila.nombre ?? 'Pendiente'); celda(row, fila.apellido ?? 'Pendiente');
      celda(row, fila.correo); celda(row, fila.fecha.split('-').reverse().join('/'));
      if (seleccion !== 'inasistencias') celda(row, fila.hora);
    }
  } catch (error) { mensaje(error.message, true); contador.textContent = 'Consulta no completada'; vaciar('No se pudo generar el reporte.'); }
  finally { controles.forEach(c => { c.disabled = false; }); }
};
window.sesionLista.then(async usuario => {
  if (!usuario || usuario.rol !== 'ADMINISTRADOR') return;
  try {
    const usuarios = await api('/api/usuarios');
    empleado.replaceChildren(new Option('Sin filtro de empleado', ''));
    for (const u of usuarios.filter(u => u.rol === 'EMPLEADO')) empleado.add(new Option(`${u.nombre ?? 'Pendiente'} ${u.apellido ?? 'Pendiente'} (${u.correo})`, u.idUsuario));
    empleado.disabled = generar.disabled = false;
  } catch (error) { mensaje(error.message, true); empleado.replaceChildren(new Option('No se pudieron cargar los empleados', '')); }
});
