const ReporteService = require('../src/services/ReporteService');
const memoria = require('./reporteFixtures');
let usuarios, registros, service;
const filtro = { desde: '2026-09-01', hasta: '2026-09-03' };
beforeEach(() => {
  usuarios = [{ idUsuario: 1, nombre: 'Admin', apellido: 'Sistema', correo: 'admin@empresa.cl', rol: 'ADMINISTRADOR' },
    { idUsuario: 2, nombre: 'Ana', apellido: 'Pérez', correo: 'ana@empresa.cl', rol: 'EMPLEADO' },
    { idUsuario: 3, nombre: null, apellido: 'Pendiente', correo: 'historico@empresa.cl', rol: 'EMPLEADO' }];
  registros = [];
  service = new ReporteService(memoria(async () => usuarios, async () => registros), { buscarPorId: async id => usuarios.find(u => u.idUsuario === id) });
});
function marca(tipoRegistro, hora, fecha = '2026-09-02', idUsuario = 2) { registros.push({ tipoRegistro, hora, fecha, idUsuario }); }
test('RE-01: 09:30:00 no es atraso', async () => { marca('ENTRADA', '09:30:00'); expect(await service.atrasos(filtro)).toEqual([]); });
test('RE-01: 09:30:01 sí es atraso', async () => { marca('ENTRADA', '09:30:01'); expect(await service.atrasos(filtro)).toHaveLength(1); });
test('RE-01: una salida posterior a 09:30 no es atraso', async () => { marca('SALIDA', '18:00:00'); expect(await service.atrasos(filtro)).toEqual([]); });
test('RE-01: rango inclusivo', async () => { for (const fecha of ['2026-08-31', '2026-09-01', '2026-09-03', '2026-09-04']) marca('ENTRADA', '10:00:00', fecha); expect((await service.atrasos(filtro)).map(r => r.fecha)).toEqual(['2026-09-03', '2026-09-01']); });
test('RE-01: filtro por empleado', async () => { marca('ENTRADA', '10:00:00'); marca('ENTRADA', '11:00:00', '2026-09-02', 3); expect((await service.atrasos({ ...filtro, idUsuario: '3' })).map(r => r.idUsuario)).toEqual([3]); });
test('RE-02: 17:30:00 no es anticipada', async () => { marca('SALIDA', '17:30:00'); expect(await service.salidasAnticipadas(filtro)).toEqual([]); });
test('RE-02: 17:29:59 sí es anticipada', async () => { marca('SALIDA', '17:29:59'); expect(await service.salidasAnticipadas(filtro)).toHaveLength(1); });
test('RE-02: entrada anterior a 17:30 no aparece', async () => { marca('ENTRADA', '08:00:00'); expect(await service.salidasAnticipadas(filtro)).toEqual([]); });
test('RE-02: rango inclusivo', async () => { for (const fecha of ['2026-08-31', '2026-09-01', '2026-09-03', '2026-09-04']) marca('SALIDA', '16:00:00', fecha); expect((await service.salidasAnticipadas(filtro)).map(r => r.fecha)).toEqual(['2026-09-03', '2026-09-01']); });
test('RE-02: filtro por empleado', async () => { marca('SALIDA', '16:00:00'); marca('SALIDA', '16:00:00', '2026-09-02', 3); expect((await service.salidasAnticipadas({ ...filtro, idUsuario: 3 })).map(r => r.idUsuario)).toEqual([3]); });
test('RE-03: sin registros aparece', async () => { expect(await service.inasistencias({ desde: '2026-09-02', hasta: '2026-09-02', idUsuario: 2 })).toHaveLength(1); });
test.each(['ENTRADA', 'SALIDA'])('RE-03: una %s basta para no ser inasistente', async tipo => { marca(tipo, '08:00:00'); expect(await service.inasistencias({ desde: '2026-09-02', hasta: '2026-09-02', idUsuario: 2 })).toEqual([]); });
test('RE-03: excluye administrador y respeta rango', async () => { const rows = await service.inasistencias(filtro); expect(rows).toHaveLength(6); expect(rows.every(r => r.idUsuario !== 1 && r.fecha >= filtro.desde && r.fecha <= filtro.hasta)).toBe(true); });
test('RE-03: filtro por empleado y nombres históricos', async () => { const rows = await service.inasistencias({ ...filtro, idUsuario: 3 }); expect(rows).toHaveLength(3); expect(rows.every(r => r.idUsuario === 3 && r.nombre === null && r.apellido === 'Pendiente')).toBe(true); });
test('RE-03: incluye fines de semana y fechas bisiestas sin inventar calendario', async () => { const rows = await service.inasistencias({ desde: '2024-02-29', hasta: '2024-03-03', idUsuario: 2 }); expect(rows.map(r => r.fecha)).toEqual(['2024-03-03', '2024-03-02', '2024-03-01', '2024-02-29']); });
test.each(['atrasos', 'salidasAnticipadas', 'inasistencias'])('%s rechaza rango invertido', async metodo => { await expect(service[metodo]({ desde: filtro.hasta, hasta: filtro.desde })).rejects.toMatchObject({ status: 400 }); });
test.each([{}, { desde: '', hasta: '2026-09-01' }, { desde: '2026-02-30', hasta: '2026-03-01' }, { desde: '2026-2-01', hasta: '2026-03-01' }, { desde: ['2026-01-01'], hasta: '2026-03-01' }])('rechaza fechas inválidas %j', async f => { await expect(service.atrasos(f)).rejects.toMatchObject({ status: 400 }); });
test.each(['', 'abc', 0, ['2', '3'], '2 OR 1=1'])('rechaza ID inválido %j', async idUsuario => { await expect(service.atrasos({ ...filtro, idUsuario })).rejects.toMatchObject({ status: 400 }); });
test('empleado inexistente devuelve 404', async () => { await expect(service.atrasos({ ...filtro, idUsuario: 999 })).rejects.toMatchObject({ status: 404 }); });
test('filtro administrador devuelve 400', async () => { await expect(service.inasistencias({ ...filtro, idUsuario: 1 })).rejects.toMatchObject({ status: 400 }); });
test('validación no consulta reportes al fallar', async () => { const repo = { atrasos: jest.fn() }; const s = new ReporteService(repo, {}); await expect(s.atrasos({})).rejects.toMatchObject({ status: 400 }); expect(repo.atrasos).not.toHaveBeenCalled(); });
