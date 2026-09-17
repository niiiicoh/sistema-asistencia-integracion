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
  atrasos: ['Atrasos', 'Hora de entrada', 'Entradas posteriores a las 09:30:00. Las entradas a las 09:30:00 exactas no son atrasos.', 'atrasos'],
  'salidas-anticipadas': ['Salidas anticipadas', 'Hora de salida', 'Salidas anteriores a las 17:30:00. Las salidas a las 17:30:00 exactas no son anticipadas.', 'salidas anticipadas'],
  inasistencias: ['Inasistencias', '', 'Empleados sin ninguna marcación en cada fecha consultada. Se incluyen todos los días: no se descuentan feriados ni fines de semana, no se consideran permisos o vacaciones y no existe todavía un calendario laboral.', 'inasistencias']
};
const graficos = document.getElementById('graficos-reportes');
const descargar = document.getElementById('descargar-reporte');
function vaciar(texto) {
  tablaVacia(resultados, texto);
  resultados.rows[0].cells[0].colSpan = tipo.value === 'inasistencias' ? 5 : 6;
  graficos.hidden = true;
  descargar.hidden = true;
}
function descargarReporteWord(seleccion, filas) {
  const [titulo] = opciones[seleccion];
  const rango = `${desde.value.split('-').reverse().join('/')} al ${hasta.value.split('-').reverse().join('/')}`;
  const columnaHora = seleccion === 'inasistencias' ? '' : '<th>Hora</th>';
  const filasHtml = filas.map(f => `<tr><td>${f.idUsuario}</td><td>${f.nombre ?? 'Pendiente'}</td><td>${f.apellido ?? 'Pendiente'}</td><td>${f.correo}</td><td>${f.fecha.split('-').reverse().join('/')}</td>${f.hora ? `<td>${f.hora}</td>` : ''}</tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title></head><body>
    <h1 style="font-family:Arial,sans-serif;">${titulo}</h1>
    <p style="font-family:Arial,sans-serif;">Del ${rango} · ${filas.length} resultado${filas.length === 1 ? '' : 's'}</p>
    <table border="1" cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">
      <thead><tr><th>ID</th><th>Nombre</th><th>Apellido</th><th>Correo</th><th>Fecha</th>${columnaHora}</tr></thead>
      <tbody>${filasHtml}</tbody>
    </table></body></html>`;
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `${seleccion}_${desde.value}_${hasta.value}.doc`;
  document.body.append(enlace); enlace.click(); enlace.remove();
  URL.revokeObjectURL(enlace.href);
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
function dibujarGraficoDia(filas) {
  const datos = agruparPorDia(filas);
  const [, , , etiquetaMin] = opciones[tipo.value];
  dibujarBarras(document.getElementById('grafico-dia'), datos, {
    etiqueta: fecha => fecha.split('-').slice(1).reverse().join('/'),
    titulo: (etq, valor) => `${etq}: ${valor}`,
    alClic: (fecha, valor, rect) => {
      const personas = filas.filter(f => f.fecha === fecha).map(f => {
        const nombre = `${f.nombre ?? 'Pendiente'} ${f.apellido ?? 'Pendiente'}`;
        return f.hora ? `${nombre} · ${f.hora}` : nombre;
      });
      const fechaBonita = fecha.split('-').reverse().join('/');
      mostrarPopoverGrafico(rect, `${etiquetaMin.charAt(0).toUpperCase()}${etiquetaMin.slice(1)} del ${fechaBonita} (${valor})`, personas);
    }
  });
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
  generar.classList.add('cargando');
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
    const [, , , etiquetaMin] = opciones[seleccion];
    const rango = `del ${desde.value.split('-').reverse().join('/')} al ${hasta.value.split('-').reverse().join('/')}`;
    document.getElementById('subtitulo-dia').textContent = `Cada barra es la cantidad de ${etiquetaMin} de ese día, ${rango}.`;
    document.getElementById('subtitulo-empleado').textContent = `Cantidad de ${etiquetaMin} por empleado, ${rango}.`;
    dibujarGraficoDia(filas);
    dibujarGraficoEmpleado(agruparPorEmpleado(filas));
    descargar.hidden = false;
    descargar.onclick = () => descargarReporteWord(seleccion, filas);
  } catch (error) { mensaje(error.message, true); contador.textContent = 'Consulta no completada'; vaciar('No se pudo generar el reporte.'); }
  finally { controles.forEach(c => { c.disabled = false; }); generar.classList.remove('cargando'); }
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
