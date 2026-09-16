window.sesionLista = (async () => {
  try {
    const usuario = await api('/api/auth/me');
    document.querySelectorAll('[data-admin]').forEach(element => { element.hidden = usuario.rol !== 'ADMINISTRADOR'; });
    document.getElementById('identidad').textContent = `${[usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.correo} · ${usuario.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Empleado'}`;
    document.getElementById('cerrar-sesion').onclick = async () => {
      try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); location.replace('/login.html'); }
      catch (error) { mensaje(error.message, true); }
    };
    return usuario;
  } catch { location.replace('/login.html'); return null; }
})();
