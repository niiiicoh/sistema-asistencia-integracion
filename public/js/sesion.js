function aplicarRol(rol) {
  document.querySelectorAll('[data-admin]').forEach(element => { element.hidden = rol !== 'ADMINISTRADOR'; });
  document.querySelectorAll('[data-empleado]').forEach(element => { element.hidden = rol === 'ADMINISTRADOR'; });
  document.body.classList.toggle('vista-empleado', rol !== 'ADMINISTRADOR');
}
const rolGuardado = sessionStorage.getItem('rol');
if (rolGuardado) aplicarRol(rolGuardado);
window.sesionLista = (async () => {
  try {
    const usuario = await api('/api/auth/me');
    sessionStorage.setItem('rol', usuario.rol);
    aplicarRol(usuario.rol);
    document.getElementById('identidad').textContent = `${[usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.correo} · ${usuario.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Empleado'}`;
    document.getElementById('cerrar-sesion').onclick = async () => {
      try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); sessionStorage.removeItem('rol'); location.replace('/login.html'); }
      catch (error) { mensaje(error.message, true); }
    };
    return usuario;
  } catch { sessionStorage.removeItem('rol'); location.replace('/login.html'); return null; }
})();
