const form = document.getElementById('formulario');
const editor = document.getElementById('editor');
const nombre = document.getElementById('nombre');
const apellido = document.getElementById('apellido');
const correo = document.getElementById('correo');
const contrasena = document.getElementById('contrasena');
const rol = document.getElementById('rol');
const guardar = document.getElementById('guardar');
const body = document.getElementById('usuarios');
let editando = null;
function abrir(usuario = null) {
  editando = usuario?.idUsuario ?? null;
  form.reset(); nombre.value = usuario?.nombre || ''; apellido.value = usuario?.apellido || ''; correo.value = usuario?.correo || ''; rol.value = usuario?.rol || 'EMPLEADO';
  contrasena.required = !usuario;
  document.getElementById('ayuda-clave').hidden = !usuario;
  document.getElementById('titulo-form').textContent = usuario ? 'Editar usuario' : 'Crear usuario';
  mostrarPanel(editor, true); nombre.focus();
}
document.getElementById('crear').onclick = () => abrir();
document.getElementById('cancelar').onclick = () => { mostrarPanel(editor, false); editando = null; document.getElementById('crear').focus(); };
async function cargar() {
  const usuarios = await api('/api/usuarios');
  body.replaceChildren();
  if (!usuarios.length) return tablaVacia(body, 'Aún no hay usuarios. Crea el primero para comenzar.');
  for (const usuario of usuarios) {
    const row = body.insertRow(); celda(row, usuario.idUsuario); celda(row, usuario.nombre || 'Pendiente'); celda(row, usuario.apellido || 'Pendiente'); celda(row, usuario.correo); celda(row, usuario.rol === 'EMPLEADO' ? 'Empleado' : 'Administrador');
    const actions = celda(row, ''); const wrap = document.createElement('div'); wrap.className = 'actions'; actions.append(wrap);
    const edit = document.createElement('button'); edit.textContent = 'Editar'; edit.className = 'secondary'; edit.setAttribute('aria-label', `Editar ${usuario.correo}`); edit.onclick = () => abrir(usuario);
    const del = document.createElement('button'); del.textContent = 'Eliminar'; del.className = 'danger'; del.setAttribute('aria-label', `Eliminar ${usuario.correo}`);
    del.onclick = async () => {
      if (!confirm(`¿Eliminar al usuario ${usuario.correo}?`)) return;
      del.disabled = true;
      try { await api(`/api/usuarios/${usuario.idUsuario}`, { method: 'DELETE' }); if (editando === usuario.idUsuario) { mostrarPanel(editor, false); editando = null; } mensaje('Usuario eliminado correctamente.'); await refrescar(); }
      catch (error) { mensaje(error.message, true); }
      finally { del.disabled = false; }
    };
    wrap.append(edit, del);
  }
  animarTabla(body);
}
async function refrescar() {
  try { await cargar(); } catch (error) { tablaVacia(body, 'No se pudo cargar el listado. Recarga la página para reintentar.'); mensaje(error.message, true); }
}
form.onsubmit = async event => {
  event.preventDefault(); guardar.disabled = true;
  const datos = { nombre: nombre.value, apellido: apellido.value, rol: rol.value };
  if (editando === null || contrasena.value !== '') datos.contrasena = contrasena.value;
  const id = editando;
  try {
    const guardado = await api(id === null ? '/api/usuarios' : `/api/usuarios/${id}`, { method: id === null ? 'POST' : 'PUT', body: JSON.stringify(datos) });
    mostrarPanel(editor, false); form.reset(); editando = null;
    mensaje(id === null ? `Usuario creado. Correo de acceso: ${guardado.correo}` : 'Usuario actualizado correctamente.'); await refrescar();
  } catch (error) { mensaje(error.message, true); }
  finally { guardar.disabled = false; }
};
window.sesionLista.then(usuario => { if (usuario?.rol === 'ADMINISTRADOR') refrescar(); });
