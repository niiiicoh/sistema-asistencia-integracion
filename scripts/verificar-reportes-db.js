// Prueba opcional de SQL real. Todas las escrituras se hacen exclusivamente en
// tablas TEMPORARY de esta conexión; las tablas persistentes no se modifican.
const assert = require('node:assert/strict');
const pool = require('../src/config/database');
const ReporteRepository = require('../src/repositories/ReporteRepository');
const ReporteService = require('../src/services/ReporteService');
(async () => {
  const db = await pool.getConnection();
  try {
    const [antes] = await db.query('SELECT (SELECT COUNT(*) FROM usuarios) usuarios, (SELECT COUNT(*) FROM registros_asistencia) registros');
    await db.query('CREATE TEMPORARY TABLE usuarios (id_usuario INT PRIMARY KEY, nombre VARCHAR(100), apellido VARCHAR(100), correo VARCHAR(150), rol VARCHAR(20))');
    await db.query('CREATE TEMPORARY TABLE registros_asistencia (id_registro INT PRIMARY KEY, id_usuario INT, tipo_registro VARCHAR(10), fecha DATE, hora TIME, INDEX (id_usuario, fecha))');
    for (const u of [[1,'Admin','Sistema','admin@test.cl','ADMINISTRADOR'],[2,'Ana','Pérez','ana@test.cl','EMPLEADO'],[3,'Luis','Soto','luis@test.cl','EMPLEADO'],[4,null,'Pendiente','historico@test.cl','EMPLEADO']]) {
      await db.execute('INSERT INTO usuarios VALUES (?, ?, ?, ?, ?)', u);
    }
    for (const r of [[1,2,'ENTRADA','2026-09-09','09:30:00'],[2,2,'SALIDA','2026-09-09','17:30:00'],[3,2,'ENTRADA','2026-09-10','09:30:01'],[4,2,'SALIDA','2026-09-10','17:29:59'],[5,3,'SALIDA','2026-09-09','08:00:00'],[6,1,'ENTRADA','2026-09-09','11:00:00']]) {
      await db.execute('INSERT INTO registros_asistencia VALUES (?, ?, ?, ?, ?)', r);
    }
    const repo = new ReporteRepository(db);
    const service = new ReporteService(repo, { buscarPorId: async id => { const [rows] = await db.execute('SELECT id_usuario AS idUsuario, rol FROM usuarios WHERE id_usuario = ?', [id]); return rows[0]; } });
    const f = { desde:'2026-09-09', hasta:'2026-09-10' };
    const atrasos = await service.atrasos(f);
    assert.deepEqual(atrasos.map(r => [r.idUsuario,r.fecha,r.hora]), [[2,'2026-09-10','09:30:01'],[1,'2026-09-09','11:00:00']]);
    assert.deepEqual((await service.salidasAnticipadas(f)).map(r => [r.idUsuario,r.hora]), [[2,'17:29:59'],[3,'08:00:00']]);
    assert.equal((await service.atrasos({...f, hasta:f.desde, idUsuario:2})).length, 0);
    assert.equal((await service.salidasAnticipadas({...f, hasta:f.desde, idUsuario:2})).length, 0);
    assert.equal((await service.atrasos({...f,idUsuario:'2'})).length, 1);
    assert.equal((await service.salidasAnticipadas({...f,idUsuario:'2'})).length, 1);
    const ausencias = await service.inasistencias(f);
    assert.deepEqual(ausencias.map(r => `${r.idUsuario}:${r.fecha}`).sort(), ['3:2026-09-10','4:2026-09-09','4:2026-09-10']);
    assert.equal(ausencias.find(r => r.idUsuario === 4).nombre, null);
    assert(!ausencias.some(r => r.idUsuario === 1));
    assert.equal((await service.inasistencias({...f,idUsuario:3})).length,1);
    assert.equal((await service.inasistencias({...f,idUsuario:2})).length,0);
    await assert.rejects(service.inasistencias({...f,idUsuario:1}), {status:400});
    await assert.rejects(service.atrasos({...f,idUsuario:99}), {status:404});
    await assert.rejects(service.atrasos({...f,desde:'2026-02-30'}), {status:400});
    await db.execute('UPDATE registros_asistencia SET hora = ? WHERE id_registro = ?', ['09:30:00',3]);
    assert.equal((await service.atrasos({...f,idUsuario:2})).length,0);
    await db.execute('UPDATE registros_asistencia SET hora = ? WHERE id_registro = ?', ['17:30:00',4]);
    assert.equal((await service.salidasAnticipadas({...f,idUsuario:2})).length,0);
    // Cruza el tamaño de lote y el límite típico de recursión de 1.000 días.
    const largo = { desde:'2022-01-01', hasta:'2026-01-01', idUsuario:4 };
    const dias = await service.inasistencias(largo);
    assert.equal(dias.length, (Date.parse(largo.hasta)-Date.parse(largo.desde))/86400000+1);
    assert.equal(dias[0].fecha,largo.hasta); assert.equal(dias.at(-1).fecha,largo.desde);
    assert.equal(new Set(dias.map(r=>r.fecha)).size,dias.length);
    assert(dias.some(r=>r.fecha==='2024-02-29'));
    assert(!JSON.stringify([...atrasos,...ausencias]).match(/contrasena|scrypt|hash/));
    const [cantidad] = await db.query('SELECT COUNT(*) AS total FROM registros_asistencia');
    assert.equal(Number(cantidad[0].total),6);
    await db.query('DROP TEMPORARY TABLE registros_asistencia');
    await db.query('DROP TEMPORARY TABLE usuarios');
    const [despues] = await db.query('SELECT (SELECT COUNT(*) FROM usuarios) usuarios, (SELECT COUNT(*) FROM registros_asistencia) registros');
    assert.deepEqual(despues,antes);
    console.log('SQL real OK: umbrales exactos, tipos, rangos, empleados, inasistencias, correcciones y rango de 1.462 días. Datos persistentes conservados.');
  } finally {
    // TEMPORARY nunca elimina tablas persistentes, incluso si falló la creación.
    await db.query('DROP TEMPORARY TABLE IF EXISTS registros_asistencia, usuarios');
    db.release();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
