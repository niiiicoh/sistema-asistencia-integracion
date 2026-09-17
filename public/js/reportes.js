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
const graficos = document.getElementById('graficos-reportes');
function vaciar(texto) {
  tablaVacia(resultados, texto);
  resultados.rows[0].cells[0].colSpan = tipo.value === 'inasistencias' ? 5 : 6;
  graficos.hidden = true;
}
function agruparPorDia(filas) {
  const mapa = new Map();
  for (const f of filas) mapa.set(f.fecha, (mapa.get(f.fecha) || 0) + 1);
  return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}
function agruparPorEmpleado(filas) {
  const mapa = new Map();
  for (const f of filas) {
    const actual = mapa.get(f.idUsuario) || { nombre: `${f.nombre ?? 'Pendiente'} ${f.apellido ?? 'Pendiente'}`, total: 0 };
    actual.total++; mapa.set(f.idUsuario, actual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total);
}
function dibujarGraficoDia(datos) {
  const svg = document.getElementById('grafico-dia');
  if (!datos.length) { svg.innerHTML = ''; return; }
  const base = 122, altoMax = 88, gap = 12, anchoBarra = 34;
  const max = Math.max(...datos.map(([, valor]) => valor));
  const ancho = gap + datos.length * (anchoBarra + gap);
  svg.setAttribute('viewBox', `0 0 ${ancho} 150`);
  svg.style.minWidth = `${Math.max(ancho, 260)}px`;
  svg.innerHTML = datos.map(([fecha, valor], i) => {
    const x = gap + i * (anchoBarra + gap);
    const h = Math.round(valor / max * altoMax);
    const etiqueta = fecha.split('-').slice(1).reverse().join('/');
    return `<text class="chart-valor" x="${x + anchoBarra / 2}" y="${base - h - 8}" text-anchor="middle">${valor}</text>
      <rect class="chart-barra" x="${x}" y="${base - h}" width="${anchoBarra}" height="${h}"><title>${etiqueta}: ${valor}</title></rect>
      <text class="chart-etiqueta" x="${x + anchoBarra / 2}" y="${base + 18}" text-anchor="middle">${etiqueta}</text>`;
  }).join('');
  requestAnimationFrame(() => requestAnimationFrame(() => { svg.querySelectorAll('.chart-barra').forEach(barra => barra.classList.add('crecer')); }));
}
function dibujarGraficoEmpleado(datos) {
  const contenedor = document.getElementById('grafico-empleado');
  if (!datos.length) { contenedor.innerHTML = ''; return; }
  const max = Math.max(...datos.map(d => d.total));
  contenedor.innerHTML = datos.map(d => {
    const pct = Math.round(d.total / max * 100);
    return `<div class="fila-ranking"><span class="fila-ranking-nombre">${d.nombre}</span><span class="fila-ranking-barra-wrap"><span class="fila-ranking-barra" style="width:0%" data-final="${pct}"></span></span><strong class="fila-ranking-valor">${d.total}</strong></div>`;
  }).join('');
  requestAnimationFrame(() => requestAnimationFrame(() => { contenedor.querySelectorAll('.fila-ranking-barra').forEach(b => { b.style.width = `${b.dataset.final}%`; }); }));
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
    graficos.hidden = false;
    dibujarGraficoDia(agruparPorDia(filas));
    dibujarGraficoEmpleado(agruparPorEmpleado(filas));
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
