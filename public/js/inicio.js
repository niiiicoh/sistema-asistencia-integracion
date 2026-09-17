function animarReloj() {
  const ahora = new Date();
  const gradosHora = (ahora.getHours() % 12 + ahora.getMinutes() / 60) * 30;
  const gradosMinuto = ahora.getMinutes() * 6;
  const segundero = document.querySelector('.hand-segundo');
  if (segundero) segundero.style.animationDelay = `-${ahora.getSeconds()}s`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const hora = document.querySelector('.hand-hora'); const minuto = document.querySelector('.hand-minuto');
    if (hora) hora.style.transform = `rotate(${gradosHora}deg)`;
    if (minuto) minuto.style.transform = `rotate(${gradosMinuto}deg)`;
  }));
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
function dibujarGraficoSemana(registros) {
  const dias = [];
  const hoy = new Date();
  for (let i = 6; i >= 0; i--) { const d = new Date(hoy); d.setDate(d.getDate() - i); dias.push(d.toISOString().slice(0, 10)); }
  const datos = dias.map(f => [f, registros.filter(r => r.fecha === f).length]);
  dibujarBarras(document.getElementById('grafico-semana'), datos, {
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
function dibujarGraficoPuntualidad(registros) {
  const hoy = new Date().toISOString().slice(0, 10);
  const entradasHoy = registros.filter(r => r.fecha === hoy && r.tipoRegistro === 'ENTRADA');
  const contenedor = document.getElementById('grafico-puntualidad');
  if (!entradasHoy.length) return;
  const listaATiempo = entradasHoy.filter(r => r.hora <= '09:30:00');
  const listaAtrasados = entradasHoy.filter(r => r.hora > '09:30:00');
  const aTiempo = listaATiempo.length, atrasados = listaAtrasados.length;
  const pct = n => Math.round(n / entradasHoy.length * 100);
  contenedor.innerHTML = `
    <div class="proporcion"><span class="segmento bien" style="width:0%"></span><span class="segmento atraso" style="width:0%"></span></div>
    <ul class="leyenda-proporcion">
      <li class="clicable" data-cual="bien"><span class="punto bien"></span>A tiempo <strong>${aTiempo}</strong> (${pct(aTiempo)}%)</li>
      <li class="clicable" data-cual="atraso"><span class="punto atraso"></span>Atrasados <strong>${atrasados}</strong> (${pct(atrasados)}%)</li>
    </ul>`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    contenedor.querySelector('.bien').style.width = `${pct(aTiempo)}%`;
    contenedor.querySelector('.atraso').style.width = `${pct(atrasados)}%`;
  }));
  const verDetalle = (cual, ancla) => {
    const lista = cual === 'bien' ? listaATiempo : listaAtrasados;
    const personas = lista.sort((a, b) => a.hora.localeCompare(b.hora)).map(r => `${r.usuario} · ${r.hora}`);
    mostrarPopoverGrafico(ancla, cual === 'bien' ? `Llegaron a tiempo (${aTiempo})` : `Llegaron atrasados (${atrasados})`, personas);
  };
  contenedor.querySelectorAll('.segmento, .clicable').forEach(el => {
    const cual = el.classList.contains('bien') || el.dataset.cual === 'bien' ? 'bien' : 'atraso';
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => verDetalle(cual, el));
  });
}
async function cargarResumen() {
  try {
    const [usuarios, registros] = await Promise.all([api('/api/usuarios'), api('/api/asistencia')]);
    const hoy = new Date().toISOString().slice(0, 10);
    animarConteo(document.getElementById('stat-empleados'), usuarios.filter(u => u.rol === 'EMPLEADO').length);
    const deHoy = registros.filter(r => r.fecha === hoy);
    animarConteo(document.getElementById('stat-marcaciones'), deHoy.length);
    animarConteo(document.getElementById('stat-atrasos'), deHoy.filter(r => r.tipoRegistro === 'ENTRADA' && r.hora > '09:30:00').length);
    dibujarGraficoSemana(registros);
    dibujarGraficoPuntualidad(registros);
  } catch { /* Si falla, las tarjetas y graficos quedan con sus valores iniciales. */ }
}
animarReloj();
window.sesionLista.then(usuario => {
  if (!usuario) return;
  document.getElementById('titulo-pagina').textContent = `¡Hola, ${usuario.nombre || usuario.correo}!`;
  cargarResumen();
});
