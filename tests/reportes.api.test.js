const request = require('supertest');
const fixture = require('./helpers');
const memoria = require('./reporteFixtures');
const ReporteService = require('../src/services/ReporteService');
const { createApp } = require('../app');
let f, app, admin, empleado, repo;
const query = '?desde=2026-09-09&hasta=2026-09-09';
beforeEach(async () => {
  f = await fixture();
  repo = memoria(() => f.ur.listar(), () => f.rr.listarTodos());
  app = createApp({ ...f, reporteService: new ReporteService(repo, f.ur) });
  admin = request.agent(app); empleado = request.agent(app);
  await admin.post('/api/auth/login').send({ correo: 'admin.sistema@empresa.cl', contrasena: 'clave-prueba' });
  await empleado.post('/api/auth/login').send({ correo: 'ana.perez@empresa.cl', contrasena: 'clave-prueba' });
});
test.each(['atrasos', 'salidas-anticipadas', 'inasistencias'])('admin consulta %s, empleado 403 y anónimo 401', async tipo => {
  await admin.get('/api/reportes/' + tipo + query).expect(200);
  await empleado.get('/api/reportes/' + tipo + query).expect(403);
  await request(app).get('/api/reportes/' + tipo + query).expect(401);
});
test('página también está protegida', async () => {
  await admin.get('/reportes.html').expect(200);
  await empleado.get('/reportes.html').expect(403);
  await request(app).get('/reportes.html').expect(302).expect('Location', '/login.html');
});
test('filtros inválidos, empleado inexistente y rol inválido', async () => {
  await admin.get('/api/reportes/atrasos?desde=2026-09-10&hasta=2026-09-09').expect(400);
  await admin.get('/api/reportes/atrasos').expect(400);
  await admin.get('/api/reportes/inasistencias' + query + '&idUsuario=99').expect(404);
  await admin.get('/api/reportes/inasistencias' + query + '&idUsuario=1').expect(400);
  await admin.get('/api/reportes/inasistencias' + query + '&idUsuario=2&idUsuario=3').expect(400);
});
test('corregir entrada cambia clasificación sin alterar validaciones existentes', async () => {
  const r = await empleado.post('/api/asistencia/entrada').send({}).expect(201);
  expect((await admin.get('/api/reportes/atrasos' + query)).body).toEqual([]);
  await admin.put('/api/asistencia/' + r.body.idRegistro).send({ tipoRegistro: 'ENTRADA', fecha: '2026-09-09', hora: '09:30:01' }).expect(200);
  expect((await admin.get('/api/reportes/atrasos' + query)).body).toHaveLength(1);
  await admin.put('/api/asistencia/' + r.body.idRegistro).send({ tipoRegistro: 'ENTRADA', fecha: '2026-09-09', hora: '09:30:00' }).expect(200);
  expect((await admin.get('/api/reportes/atrasos' + query)).body).toEqual([]);
  await empleado.post('/api/asistencia/entrada').send({}).expect(409);
});
test('corregir salida a 17:30 elimina clasificación anticipada', async () => {
  await empleado.post('/api/asistencia/entrada').send({});
  const r = await empleado.post('/api/asistencia/salida').send({});
  expect((await admin.get('/api/reportes/salidas-anticipadas' + query)).body).toHaveLength(1);
  await admin.put('/api/asistencia/' + r.body.idRegistro).send({ tipoRegistro: 'SALIDA', fecha: '2026-09-09', hora: '17:30:00' }).expect(200);
  expect((await admin.get('/api/reportes/salidas-anticipadas' + query)).body).toEqual([]);
});
test('inasistencia cambia tras marcar; no se escriben reportes ni exponen contraseñas', async () => {
  expect((await admin.get('/api/reportes/inasistencias' + query)).body).toHaveLength(2);
  expect(f.registros).toHaveLength(0);
  await empleado.post('/api/asistencia/entrada').send({});
  const r = await admin.get('/api/reportes/inasistencias' + query);
  expect(r.body.map(u => u.idUsuario)).toEqual([3]);
  expect(r.body[0]).toEqual({ idUsuario: 3, nombre: 'Luis', apellido: 'Soto', correo: 'luis.soto@empresa.cl', fecha: '2026-09-09' });
  expect(JSON.stringify(r.body)).not.toMatch(/contrasena|scrypt|hash/);
  expect(f.registros).toHaveLength(1);
});
test('error SQL no filtra detalles internos', async () => {
  repo.atrasos = async () => { throw new Error('SQL password=secreto'); };
  const r = await admin.get('/api/reportes/atrasos' + query).expect(500);
  expect(JSON.stringify(r.body)).not.toMatch(/SQL|secreto|stack/);
});
