const request = require('supertest');
const fixture = require('./helpers');
let f, admin, empleado;
beforeEach(async () => {
 f = await fixture(); admin = request.agent(f.app); empleado = request.agent(f.app);
 await admin.post('/api/auth/login').send({correo:'admin.sistema@empresa.cl',contrasena:'clave-prueba'}).expect(200);
 await empleado.post('/api/auth/login').send({correo:'ana.perez@empresa.cl',contrasena:'clave-prueba'}).expect(200);
});
test('sin sesión no se accede a API y páginas redirigen a login', async()=>{
 await request(f.app).get('/api/usuarios').expect(401); await request(f.app).get('/api/asistencia').expect(401);
 await request(f.app).get('/usuarios.html').expect(302).expect('Location','/login.html');
 await request(f.app).get('/login.html').expect(200);
});
test('login incorrecto, cookie protegida y logout', async()=>{
 await request(f.app).post('/api/auth/login').send({correo:'admin.sistema@empresa.cl',contrasena:'mala'}).expect(401);
 const r=await admin.post('/api/auth/login').send({correo:'admin.sistema@empresa.cl',contrasena:'clave-prueba'}).expect(200);
 expect(r.body).not.toHaveProperty('contrasena'); expect(r.headers['set-cookie'][0]).toMatch(/HttpOnly/); expect(r.headers['set-cookie'][0]).toMatch(/SameSite=Strict/);
 await admin.post('/api/auth/logout').send({}).expect(200); await admin.get('/api/auth/me').expect(401);
});
test('empleado no gestiona usuarios ni registros ajenos', async()=>{
 await empleado.get('/api/usuarios').expect(403);
 await empleado.post('/api/usuarios').send({}).expect(403);
 await empleado.put('/api/usuarios/1').send({rol:'ADMINISTRADOR'}).expect(403);
 await empleado.delete('/api/usuarios/1').expect(403);
 await empleado.get('/api/asistencia/usuario/3').expect(403);
 await empleado.put('/api/asistencia/1').send({}).expect(403);
 await empleado.delete('/api/asistencia/1').expect(403);
 await empleado.get('/usuarios.html').expect(302).expect('Location','/asistencia.html');
});
test('admin crea correo automático, resuelve homónimos y edita usuario', async()=>{
 const datos={nombre:'Bastián',apellido:'Alegría',contrasena:'clave',rol:'EMPLEADO',correo:'falso@otro.cl'};
 const a=await admin.post('/api/usuarios').send(datos).expect(201); expect(a.body.correo).toBe('bastian.alegria@empresa.cl');
 const b=await admin.post('/api/usuarios').send(datos).expect(201); expect(b.body.correo).toBe('bastian.alegria2@empresa.cl');
 await admin.put('/api/usuarios/'+a.body.idUsuario).send({nombre:'Bastian',correo:'otro@correo.cl'}).expect(200);
 expect((await admin.get('/api/usuarios/'+a.body.idUsuario)).body.correo).toBe('bastian.alegria@empresa.cl');
 await admin.delete('/api/usuarios/'+b.body.idUsuario).expect(200);
});
test('marcas propias, fecha del servidor, sin salida inicial ni entradas repetidas', async()=>{
 await empleado.post('/api/asistencia/salida').send({}).expect(409);
 const a=await empleado.post('/api/asistencia/entrada').send({idUsuario:3,fecha:'2000-01-01'}).expect(201);
 expect(a.body).toMatchObject({idUsuario:2,fecha:'2026-09-09',tipoRegistro:'ENTRADA',hora:'08:05:03'});
 await empleado.post('/api/asistencia/entrada').send({}).expect(409);
 await empleado.post('/api/asistencia/salida').send({}).expect(201);
 await empleado.post('/api/asistencia/salida').send({}).expect(409);
 await admin.post('/api/asistencia/entrada').send({}).expect(201);
 expect((await empleado.get('/api/asistencia')).body).toHaveLength(2);
 expect((await admin.get('/api/asistencia')).body).toHaveLength(3);
 await admin.delete('/api/usuarios/2').expect(409);
});
test('admin modifica y elimina manteniendo secuencia válida', async()=>{
 const a=await empleado.post('/api/asistencia/entrada').send({}).expect(201);
 const b=await empleado.post('/api/asistencia/salida').send({}).expect(201);
 await admin.put('/api/asistencia/'+a.body.idRegistro).send({tipoRegistro:'ENTRADA',fecha:'2026-09-09',hora:'07:00:00'}).expect(200);
 await admin.put('/api/asistencia/'+a.body.idRegistro).send({tipoRegistro:'SALIDA',fecha:'2026-09-09',hora:'07:00:00'}).expect(409);
 await admin.delete('/api/asistencia/'+a.body.idRegistro).expect(409);
 await admin.delete('/api/asistencia/'+b.body.idRegistro).expect(200);
 await admin.delete('/api/asistencia/'+a.body.idRegistro).expect(200);
 expect((await empleado.get('/api/asistencia')).body).toEqual([]);
});
test('validación de correcciones, JSON inválido y origen externo', async()=>{
 const a=await empleado.post('/api/asistencia/entrada').send({});
 await admin.put('/api/asistencia/'+a.body.idRegistro).send({tipoRegistro:'ENTRADA',fecha:'2026-02-30',hora:'07:00:00'}).expect(400);
 await admin.put('/api/asistencia/999').send({}).expect(404);
 await admin.post('/api/usuarios').set('Content-Type','application/json').send('{').expect(400);
 await admin.post('/api/usuarios').set('Origin','https://externo.cl').send({}).expect(403);
});
test('cambio de contraseña invalida sesión existente', async()=>{
 await admin.put('/api/usuarios/2').send({contrasena:'nueva-clave'}).expect(200);
 await empleado.get('/api/auth/me').expect(401);
});
test('errores internos no exponen detalles', async()=>{
 f.ur.listar=async()=>{throw new Error('mysql password=secreto');};
 const r=await admin.get('/api/usuarios').expect(500);expect(JSON.stringify(r.body)).not.toMatch(/secreto|stack/);
});
test('configuración de IP permitida es exclusiva de administrador', async()=>{
 await empleado.get('/api/configuracion/ip-permitida').expect(403);
 await empleado.put('/api/configuracion/ip-permitida').send({ip:'1.2.3.4'}).expect(403);
});
test('admin consulta y guarda la IP permitida', async()=>{
 const inicial=await admin.get('/api/configuracion/ip-permitida').expect(200);
 expect(inicial.body.ip).toBeNull();
 expect(inicial.body).toHaveProperty('ipActual');
 const guardado=await admin.put('/api/configuracion/ip-permitida').send({ip:'181.42.190.187'}).expect(200);
 expect(guardado.body.ip).toBe('181.42.190.187');
 await admin.put('/api/configuracion/ip-permitida').send({ip:'no-valida'}).expect(400);
 await admin.put('/api/configuracion/ip-permitida').send({ip:''}).expect(200);
 expect((await admin.get('/api/configuracion/ip-permitida').expect(200)).body.ip).toBeNull();
});
