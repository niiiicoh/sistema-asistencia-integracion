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
