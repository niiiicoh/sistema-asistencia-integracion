async function api(url, options = {}) {
  let response;
  try { response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json' } }); }
  catch { throw new Error('No se pudo conectar con el servidor. Inténtalo nuevamente.'); }
  const data = await response.json();
  if (response.status === 401 && !url.endsWith('/login')) location.replace('/login.html');
  if (!response.ok) throw new Error(data.mensaje || 'No se pudo completar la operación.');
  return data;
}
function mensaje(texto, error = false) {
  const element = document.getElementById('mensaje');
  element.textContent = texto; element.className = error ? 'message error' : 'message'; element.hidden = false;
  element.classList.remove('mensaje-anim');
  void element.offsetWidth;
  element.classList.add('mensaje-anim');
}
function animarTexto(elemento) {
  elemento.classList.remove('mensaje-anim');
  void elemento.offsetWidth;
  elemento.classList.add('mensaje-anim');
}
function animarTabla(tbody) {
  tbody.classList.remove('tabla-anim');
  void tbody.offsetWidth;
  tbody.classList.add('tabla-anim');
}
function mostrarPanel(elemento, mostrar) {
  if (mostrar) {
    elemento.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => elemento.classList.add('abierto')));
  } else {
    elemento.classList.remove('abierto');
    const alTerminar = evento => { if (evento.target === elemento && evento.propertyName === 'max-height') { elemento.hidden = true; elemento.removeEventListener('transitionend', alTerminar); } };
    elemento.addEventListener('transitionend', alTerminar);
  }
}
function celda(row, text) { const td = document.createElement('td'); td.textContent = text; row.append(td); return td; }
function tablaVacia(body, texto) { body.replaceChildren(); const row = body.insertRow(); const td = celda(row, texto); td.colSpan = body.closest('table').querySelectorAll('thead th').length; td.className = 'empty'; }
function dibujarBarras(svg, datos, { etiqueta = clave => clave, titulo = (etq, valor) => `${etq}: ${valor}`, alClic } = {}) {
  if (!datos.length) { svg.innerHTML = ''; return; }
  const ancho = 400, base = 62, altoMax = 40, gap = 12, alto = 84;
  const anchoBarra = Math.min(40, (ancho - gap * (datos.length + 1)) / datos.length);
  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  const max = Math.max(...datos.map(([, valor]) => valor)) || 1;
  const inicioFila = (ancho - (datos.length * anchoBarra + (datos.length - 1) * gap)) / 2;
  const barras = datos.map(([clave, valor], i) => {
    const x = inicioFila + i * (anchoBarra + gap);
    const h = Math.round(valor / max * altoMax);
    const texto = etiqueta(clave);
    return `<text class="chart-valor" x="${x + anchoBarra / 2}" y="${base - h - 7}" text-anchor="middle">${valor}</text>
      <rect class="chart-barra" rx="3" x="${x}" y="${base - h}" width="${anchoBarra}" height="${h}"><title>${titulo(texto, valor)}</title></rect>
      <text class="chart-etiqueta" x="${x + anchoBarra / 2}" y="${base + 16}" text-anchor="middle">${texto}</text>`;
  }).join('');
  svg.innerHTML = `<line class="chart-base" x1="0" y1="${base}" x2="${ancho}" y2="${base}"/>${barras}`;
  requestAnimationFrame(() => requestAnimationFrame(() => { svg.querySelectorAll('.chart-barra').forEach(barra => barra.classList.add('crecer')); }));
  if (alClic) svg.querySelectorAll('.chart-barra').forEach((rect, i) => {
    rect.style.cursor = 'pointer';
    rect.addEventListener('click', () => alClic(datos[i][0], datos[i][1], rect));
  });
}
let popoverGraficoActual = null;
function cerrarPopoverGrafico() {
  if (!popoverGraficoActual) return;
  popoverGraficoActual.remove(); popoverGraficoActual = null;
  document.removeEventListener('click', cerrarPopoverAlClicFuera, true);
  document.removeEventListener('keydown', cerrarPopoverConEscape, true);
}
function cerrarPopoverAlClicFuera(evento) { if (popoverGraficoActual && !popoverGraficoActual.contains(evento.target)) cerrarPopoverGrafico(); }
function cerrarPopoverConEscape(evento) { if (evento.key === 'Escape') cerrarPopoverGrafico(); }
function mostrarPopoverGrafico(ancla, titulo, items) {
  cerrarPopoverGrafico();
  const pop = document.createElement('div'); pop.className = 'chart-popover'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', titulo);
  pop.innerHTML = `<button type="button" class="chart-popover-cerrar" aria-label="Cerrar">×</button><strong>${titulo}</strong>${items.length ? `<ul>${items.map(texto => `<li>${texto}</li>`).join('')}</ul>` : '<p>Nadie en esta categoría.</p>'}`;
  document.body.append(pop);
  const rectAncla = ancla.getBoundingClientRect(); const rectPop = pop.getBoundingClientRect();
  let left = rectAncla.left + rectAncla.width / 2 - rectPop.width / 2 + window.scrollX;
  left = Math.max(8 + window.scrollX, Math.min(left, window.scrollX + document.documentElement.clientWidth - rectPop.width - 8));
  let top = rectAncla.top - rectPop.height - 10 + window.scrollY;
  if (top < window.scrollY + 8) top = rectAncla.bottom + 10 + window.scrollY;
  pop.style.left = `${left}px`; pop.style.top = `${top}px`;
  pop.querySelector('.chart-popover-cerrar').onclick = cerrarPopoverGrafico;
  popoverGraficoActual = pop;
  setTimeout(() => { document.addEventListener('click', cerrarPopoverAlClicFuera, true); document.addEventListener('keydown', cerrarPopoverConEscape, true); });
}
