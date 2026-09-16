const AppError = require('../utils/AppError');
class Usuario {
  constructor({ idUsuario = null, nombre, apellido, correo, contrasena, rol } = {}, { permitirDatosHistoricos = false } = {}) {
    const validarNombre = (valor, campo) => {
      // Solo al leer registros anteriores a la migración se admite un dato pendiente.
      if (permitirDatosHistoricos && valor === null) return null;
      if (typeof valor !== 'string' || !valor.trim()) throw new AppError(400, `El ${campo} es obligatorio.`);
      if (valor.trim().length > 100) throw new AppError(400, `El ${campo} admite hasta 100 caracteres.`);
      return valor.trim();
    };
    nombre = validarNombre(nombre, 'nombre');
    apellido = validarNombre(apellido, 'apellido');
    if (typeof correo !== 'string' || !correo.trim()) throw new AppError(400, 'El correo es obligatorio.');
    correo = correo.trim().toLowerCase();
    if (correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new AppError(400, 'Ingrese un correo válido de hasta 150 caracteres.');
    if (typeof contrasena !== 'string' || !contrasena.trim()) throw new AppError(400, 'La contraseña es obligatoria.');
    if (contrasena.length > 255) throw new AppError(400, 'La contraseña admite hasta 255 caracteres.');
    if (!['EMPLEADO', 'ADMINISTRADOR'].includes(rol)) throw new AppError(400, 'Seleccione un rol válido: EMPLEADO o ADMINISTRADOR.');
    Object.assign(this, { idUsuario, nombre, apellido, correo, contrasena, rol });
  }
  toJSON() { return { idUsuario: this.idUsuario, nombre: this.nombre, apellido: this.apellido, correo: this.correo, rol: this.rol }; }
}
module.exports = Usuario;
