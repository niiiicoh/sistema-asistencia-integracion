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
}
function celda(row, text) { const td = document.createElement('td'); td.textContent = text; row.append(td); return td; }
function tablaVacia(body, texto) { body.replaceChildren(); const row = body.insertRow(); const td = celda(row, texto); td.colSpan = body.closest('table').querySelectorAll('thead th').length; td.className = 'empty'; }
function dibujarBarras(svg, datos, { etiqueta = clave => clave, titulo = (etq, valor) => `${etq}: ${valor}` } = {}) {
  if (!datos.length) { svg.removeAttribute('viewBox'); svg.innerHTML = ''; return; }
  const base = 62, altoMax = 40, gap = 12, anchoBarra = 34, alto = 84;
  const max = Math.max(...datos.map(([, valor]) => valor)) || 1;
  const ancho = gap + datos.length * (anchoBarra + gap);
  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  svg.style.minWidth = `${Math.max(ancho, 240)}px`;
  const barras = datos.map(([clave, valor], i) => {
    const x = gap + i * (anchoBarra + gap);
    const h = Math.round(valor / max * altoMax);
    const texto = etiqueta(clave);
    return `<text class="chart-valor" x="${x + anchoBarra / 2}" y="${base - h - 7}" text-anchor="middle">${valor}</text>
      <rect class="chart-barra" rx="3" x="${x}" y="${base - h}" width="${anchoBarra}" height="${h}"><title>${titulo(texto, valor)}</title></rect>
      <text class="chart-etiqueta" x="${x + anchoBarra / 2}" y="${base + 16}" text-anchor="middle">${texto}</text>`;
  }).join('');
  svg.innerHTML = `<line class="chart-base" x1="0" y1="${base}" x2="${ancho}" y2="${base}"/>${barras}`;
  requestAnimationFrame(() => requestAnimationFrame(() => { svg.querySelectorAll('.chart-barra').forEach(barra => barra.classList.add('crecer')); }));
}
