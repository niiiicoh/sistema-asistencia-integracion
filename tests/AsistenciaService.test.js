const fixture = require('./helpers');
let f;
beforeEach(async()=>{ f=await fixture(); });
test('registrar entrada válida con fecha, hora y asociación correctas',async()=>{
 expect(await f.asistenciaService.registrarEntrada(2)).toMatchObject({idUsuario:2,tipoRegistro:'ENTRADA',fecha:'2026-09-09',hora:'08:05:03'});
});
test('registrar salida después de entrada',async()=>{
 await f.asistenciaService.registrarEntrada(2); expect((await f.asistenciaService.registrarSalida(2)).tipoRegistro).toBe('SALIDA');
});
test('rechazar usuario inexistente',async()=>{await expect(f.asistenciaService.registrarEntrada(99)).rejects.toMatchObject({status:404});});
test('rechazar salida sin entrada',async()=>{await expect(f.asistenciaService.registrarSalida(2)).rejects.toMatchObject({status:409});});
test('rechazar dos entradas',async()=>{await f.asistenciaService.registrarEntrada(2); await expect(f.asistenciaService.registrarEntrada(2)).rejects.toMatchObject({status:409});});
test('rechazar dos salidas',async()=>{await f.asistenciaService.registrarEntrada(2);await f.asistenciaService.registrarSalida(2);await expect(f.asistenciaService.registrarSalida(2)).rejects.toMatchObject({status:409});});
test('permitir nueva entrada tras salida',async()=>{await f.asistenciaService.registrarEntrada(2);await f.asistenciaService.registrarSalida(2);expect((await f.asistenciaService.registrarEntrada(2)).tipoRegistro).toBe('ENTRADA');});
test('rechazar tipo inválido',async()=>{await expect(f.asistenciaService.registrar(2,'OTRO')).rejects.toMatchObject({status:400});});
test('permitir salida al día siguiente de entrada',async()=>{
 await f.asistenciaService.registrarEntrada(2); f.asistenciaService.reloj=()=>new Date(2026,8,10,7,0,0);
 expect((await f.asistenciaService.registrarSalida(2)).fecha).toBe('2026-09-10');
});
