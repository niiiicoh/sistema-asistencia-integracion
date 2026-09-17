async function api(url, options = {}) {
  let response;
  try { response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json' } }); }
  catch { throw new Error('No se pudo conectar con el servidor. Inténtalo nuevamente.'); }
  const data = await response.json();
  if (response.status === 401 && !url.endsWith('/login')) location.replace('/login.html');
  if (!response.ok) { const error = new Error(data.mensaje || 'No se pudo completar la operación.'); error.status = response.status; throw error; }
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
function confirmar(texto, { textoConfirmar = 'Eliminar' } = {}) {
  return new Promise(resolver => {
    const fondo = document.createElement('div'); fondo.className = 'confirm-backdrop';
    const caja = document.createElement('div'); caja.className = 'confirm-dialog'; caja.setAttribute('role', 'alertdialog'); caja.setAttribute('aria-modal', 'true');
    caja.innerHTML = `<p>${texto}</p><div class="actions"><button type="button" class="secondary" data-accion="cancelar">Cancelar</button><button type="button" class="danger" data-accion="confirmar">${textoConfirmar}</button></div>`;
    fondo.append(caja); document.body.append(fondo);
    const cerrar = resultado => {
      fondo.remove();
      document.removeEventListener('keydown', alEscape);
      resolver(resultado);
    };
    const alEscape = evento => { if (evento.key === 'Escape') cerrar(false); };
    fondo.addEventListener('click', evento => { if (evento.target === fondo) cerrar(false); });
    caja.querySelector('[data-accion="cancelar"]').onclick = () => cerrar(false);
    caja.querySelector('[data-accion="confirmar"]').onclick = () => cerrar(true);
    document.addEventListener('keydown', alEscape);
    caja.querySelector('[data-accion="cancelar"]').focus();
  });
}
function animarConteo(elemento, valorFinal) {
  elemento.dataset.valor = valorFinal;
  const duracion = 900; const inicio = performance.now();
  requestAnimationFrame(function paso(ahora) {
    const avance = Math.min(1, (ahora - inicio) / duracion);
    const suavizado = 1 - Math.pow(1 - avance, 3);
    elemento.textContent = Math.round(valorFinal * suavizado);
    if (avance < 1) requestAnimationFrame(paso);
  });
}
function dibujarGraficoSemana(svg, registros) {
  const dias = [];
  const hoy = new Date();
  for (let i = 6; i >= 0; i--) { const d = new Date(hoy); d.setDate(d.getDate() - i); dias.push(d.toISOString().slice(0, 10)); }
  const datos = dias.map(f => [f, registros.filter(r => r.fecha === f).length]);
  dibujarBarras(svg, datos, {
    etiqueta: f => new Date(`${f}T00:00:00`).toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', ''),
    titulo: (etq, valor) => `${etq}: ${valor} marcaciones`,
    alClic: (fecha, valor, rect) => {
      const personas = registros.filter(r => r.fecha === fecha)
        .sort((a, b) => a.hora.localeCompare(b.hora))
        .map(r => `${r.usuario} · ${r.tipoRegistro === 'ENTRADA' ? 'Entrada' : 'Salida'} ${r.hora}`);
      const fechaBonita = new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
      mostrarPopoverGrafico(rect, `${fechaBonita.charAt(0).toUpperCase()}${fechaBonita.slice(1)} (${valor})`, personas);
    }
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
