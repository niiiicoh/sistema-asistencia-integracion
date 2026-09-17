const UsuarioService = require('../src/services/UsuarioService');
const Usuario = require('../src/models/Usuario');
const hashPassword = require('../src/utils/password');
const datos = { nombre: 'Ana', apellido: 'Pérez', correo: 'persona@ejemplo.cl', contrasena: 'secreto', rol: 'EMPLEADO' };
let repo, registros, service;
beforeEach(() => {
  repo = { listar: jest.fn(), buscarPorId: jest.fn(), buscarPorCorreo: jest.fn().mockResolvedValue(null),
    crear: jest.fn().mockImplementation(async u => { u.idUsuario = 1; return u; }), modificar: jest.fn().mockResolvedValue(1), eliminar: jest.fn().mockResolvedValue(1) };
  registros = { eliminarPorUsuario: jest.fn().mockResolvedValue() };
  service = new UsuarioService(repo, async () => 'hash-seguro', registros);
});
test('crear usuario válido y guardar contraseña transformada', async () => {
  const result = await service.crear(datos);
  expect(result.idUsuario).toBe(1); expect(repo.crear.mock.calls[0][0].contrasena).toBe('hash-seguro');
  expect(JSON.parse(JSON.stringify(result))).not.toHaveProperty('contrasena');
});
test.each([
  ['nombre vacío', { nombre: '   ' }], ['nombre ausente', { nombre: undefined }],
  ['apellido vacío', { apellido: '' }], ['apellido nulo', { apellido: null }],
  ['nombre demasiado largo', { nombre: 'a'.repeat(101) }], ['apellido demasiado largo', { apellido: 'a'.repeat(101) }],
  ['contraseña vacía', { contrasena: '' }], ['rol inválido', { rol: 'OTRO' }], ['rol ausente', { rol: undefined }]
])('rechazar %s', async (_, cambio) => { await expect(service.crear({ ...datos, ...cambio })).rejects.toMatchObject({ status: 400 }); expect(repo.crear).not.toHaveBeenCalled(); });
test('rechazar correo duplicado', async () => {
  repo.buscarPorCorreo.mockResolvedValue({ idUsuario: 2 });
  await expect(service.crear(datos)).rejects.toMatchObject({ status: 409 });
});
test('modificar usuario existente', async () => {
  repo.buscarPorId.mockResolvedValue(new Usuario({ ...datos, idUsuario: 1 }));
  const result = await service.modificar(1, { correo: 'nuevo@ejemplo.cl', contrasena: 'nueva', rol: 'ADMINISTRADOR' });
  expect(result.correo).toBe(datos.correo); expect(result.rol).toBe('ADMINISTRADOR'); expect(repo.modificar).toHaveBeenCalledWith(1, result);
});
test('guardar y serializar nombre y apellido sin espacios exteriores', async () => {
  const usuario = await service.crear({ ...datos, nombre: '  María José  ', apellido: "  O’Connor Pérez  " });
  expect(usuario.toJSON()).toMatchObject({ nombre: 'María José', apellido: 'O’Connor Pérez' });
});
test('editar nombre y apellido', async () => {
  repo.buscarPorId.mockResolvedValue(new Usuario({ ...datos, idUsuario: 1 }));
  const usuario = await service.modificar(1, { nombre: 'Luis', apellido: 'Gómez' });
  expect(usuario.toJSON()).toMatchObject({ nombre: 'Luis', apellido: 'Gómez', correo: datos.correo });
});
test('leer usuario histórico sin inventar nombre y completar sus datos', async () => {
  const historico = new Usuario({ ...datos, idUsuario: 1, nombre: null, apellido: null }, { permitirDatosHistoricos: true });
  repo.buscarPorId.mockResolvedValue(historico);
  expect((await service.buscarPorId(1)).toJSON().nombre).toBeNull();
  await expect(service.modificar(1, { rol: 'ADMINISTRADOR' })).rejects.toMatchObject({ status: 400 });
  expect((await service.modificar(1, { nombre: 'Ana', apellido: 'Pérez' })).nombre).toBe('Ana');
});
test('conservar contraseña cuando se omite al modificar y permitir el mismo correo', async () => {
  const actual = new Usuario({ ...datos, idUsuario: 1 });
  repo.buscarPorId.mockResolvedValue(actual); repo.buscarPorCorreo.mockResolvedValue(actual);
  expect((await service.modificar(1, { rol: 'ADMINISTRADOR' })).contrasena).toBe(actual.contrasena);
});
test('rechazar modificación con correo de otro usuario', async () => {
  repo.buscarPorId.mockResolvedValue(new Usuario({ ...datos, idUsuario: 1 })); repo.buscarPorCorreo.mockResolvedValue({ idUsuario: 2 });
  await expect(service.modificar(1, { correo: 'otro@ejemplo.cl' })).rejects.toMatchObject({ status: 409 });
});
test('rechazar modificación de usuario inexistente', async () => { await expect(service.modificar(99, datos)).rejects.toMatchObject({ status: 404 }); });
test('eliminar usuario existente', async () => {
  repo.buscarPorId.mockResolvedValue({ idUsuario: 1 }); await service.eliminar(1); expect(repo.eliminar).toHaveBeenCalledWith(1);
});
test('rechazar eliminación de usuario inexistente', async () => { await expect(service.eliminar(99)).rejects.toMatchObject({ status: 404 }); expect(repo.eliminar).not.toHaveBeenCalled(); });
test('devolver conflicto al eliminar usuario con asistencia', async () => {
  repo.buscarPorId.mockResolvedValue({ idUsuario: 1 }); repo.eliminar.mockRejectedValue({ code: 'ER_ROW_IS_REFERENCED_2' });
  await expect(service.eliminar(1)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('asistencia') });
  expect(registros.eliminarPorUsuario).not.toHaveBeenCalled();
});
test('forzar eliminación borra primero los registros de asistencia del usuario', async () => {
  repo.buscarPorId.mockResolvedValue({ idUsuario: 1 });
  await service.eliminar(1, true);
  expect(registros.eliminarPorUsuario).toHaveBeenCalledWith(1);
  expect(repo.eliminar).toHaveBeenCalledWith(1);
});
test('traducir duplicado concurrente de MySQL', async () => {
  repo.crear.mockRejectedValue({ code: 'ER_DUP_ENTRY' }); await expect(service.crear(datos)).rejects.toMatchObject({ status: 409 });
});
test.each([0, -1, '1abc', 1.5, null, true])('rechazar ID inválido %s', async id => { await expect(service.buscarPorId(id)).rejects.toMatchObject({ status: 400 }); });
test('hash real usa sal aleatoria y no guarda texto plano', async () => {
  const a = await hashPassword('clave'); const b = await hashPassword('clave');
  expect(a).toMatch(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/); expect(a).not.toBe(b);
});
