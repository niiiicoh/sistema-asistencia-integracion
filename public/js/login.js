const formLogin = document.getElementById('login');
formLogin.onsubmit = async event => {
  event.preventDefault(); const boton = document.getElementById('ingresar'); boton.disabled = true; boton.classList.add('cargando');
  try {
    const usuario = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo: document.getElementById('correo').value, contrasena: document.getElementById('contrasena').value }) });
    sessionStorage.setItem('rol', usuario.rol);
    location.replace(usuario.rol === 'ADMINISTRADOR' ? '/' : '/asistencia.html');
  } catch (error) {
    mensaje(error.message, true);
    formLogin.classList.remove('shake'); void formLogin.offsetWidth; formLogin.classList.add('shake');
  }
  finally { boton.disabled = false; boton.classList.remove('cargando'); }
};
