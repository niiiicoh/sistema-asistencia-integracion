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
test('sin IP configurada, marcar funciona desde cualquier IP',async()=>{
 expect(await f.asistenciaService.registrarEntrada(2,'200.1.2.3')).toMatchObject({idUsuario:2,tipoRegistro:'ENTRADA'});
});
test('con IP configurada, rechaza marcar desde otra IP',async()=>{
 await f.configuracionService.agregarIpPermitida('181.42.190.187');
 await expect(f.asistenciaService.registrarEntrada(2,'200.1.2.3')).rejects.toMatchObject({status:403});
});
test('con IP configurada, permite marcar desde esa IP exacta',async()=>{
 await f.configuracionService.agregarIpPermitida('181.42.190.187');
 expect((await f.asistenciaService.registrarEntrada(2,'181.42.190.187')).tipoRegistro).toBe('ENTRADA');
});
test('acepta la notacion IPv4-mapped (::ffff:) como la misma IP',async()=>{
 await f.configuracionService.agregarIpPermitida('181.42.190.187');
 expect((await f.asistenciaService.registrarEntrada(2,'::ffff:181.42.190.187')).tipoRegistro).toBe('ENTRADA');
});
test('con dos oficinas configuradas, permite marcar desde cualquiera de las dos IPs',async()=>{
 await f.configuracionService.agregarIpPermitida('181.42.190.187');
 await f.configuracionService.agregarIpPermitida('190.100.50.20');
 expect((await f.asistenciaService.registrarEntrada(2,'190.100.50.20')).tipoRegistro).toBe('ENTRADA');
 await f.asistenciaService.registrarSalida(2,'190.100.50.20');
 expect((await f.asistenciaService.registrarEntrada(2,'181.42.190.187')).tipoRegistro).toBe('ENTRADA');
});
test('eliminar la única IP configurada vuelve a permitir cualquier red',async()=>{
 const [{idIp}] = await f.configuracionService.agregarIpPermitida('181.42.190.187');
 await f.configuracionService.eliminarIpPermitida(idIp);
 expect((await f.asistenciaService.registrarEntrada(2,'200.1.2.3')).tipoRegistro).toBe('ENTRADA');
});
test('la restricción de red no aplica al administrador',async()=>{
 await f.configuracionService.agregarIpPermitida('181.42.190.187');
 expect((await f.asistenciaService.registrarEntrada(1,'200.1.2.3')).tipoRegistro).toBe('ENTRADA');
});
