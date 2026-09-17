const ConfiguracionService = require('../src/services/ConfiguracionService');
let servicio, ips;
beforeEach(() => {
  ips = []; let nextIp = 1;
  const repo = {
    listarIps: async () => [...ips],
    agregarIp: async ip => { if (!ips.some(fila => fila.ip === ip)) ips.push({ idIp: nextIp++, ip, creadoEn: new Date() }); },
    eliminarIp: async idIp => { const i = ips.findIndex(fila => fila.idIp === Number(idIp)); if (i >= 0) ips.splice(i, 1); }
  };
  servicio = new ConfiguracionService(repo);
});
test('sin IPs guardadas, la lista está vacía y no hay restricción', async () => {
  expect(await servicio.listarIpsPermitidas()).toEqual([]);
  expect(await servicio.obtenerIpsPermitidas()).toEqual([]);
});
test('agrega una IPv4 válida y queda en la lista', async () => {
  const lista = await servicio.agregarIpPermitida('181.42.190.187');
  expect(lista).toMatchObject([{ ip: '181.42.190.187' }]);
  expect(await servicio.obtenerIpsPermitidas()).toEqual(['181.42.190.187']);
});
test('permite guardar dos IPs (dos oficinas)', async () => {
  await servicio.agregarIpPermitida('181.42.190.187');
  await servicio.agregarIpPermitida('190.100.50.20');
  expect(await servicio.obtenerIpsPermitidas()).toEqual(['181.42.190.187', '190.100.50.20']);
});
test('recorta espacios en la IP', async () => {
  const lista = await servicio.agregarIpPermitida('  181.42.190.187  ');
  expect(lista[0].ip).toBe('181.42.190.187');
});
test('no duplica una IP ya agregada', async () => {
  await servicio.agregarIpPermitida('181.42.190.187');
  const lista = await servicio.agregarIpPermitida('181.42.190.187');
  expect(lista).toHaveLength(1);
});
test('rechaza una IP vacía', async () => {
  await expect(servicio.agregarIpPermitida('')).rejects.toMatchObject({ status: 400 });
  await expect(servicio.agregarIpPermitida('   ')).rejects.toMatchObject({ status: 400 });
});
test('rechaza una IP con formato inválido', async () => {
  await expect(servicio.agregarIpPermitida('no-es-una-ip')).rejects.toMatchObject({ status: 400 });
});
test('rechaza una IPv6 (se espera IPv4)', async () => {
  await expect(servicio.agregarIpPermitida('2800:300:6a33::1')).rejects.toMatchObject({ status: 400 });
});
test('rechaza octetos fuera de rango', async () => {
  await expect(servicio.agregarIpPermitida('999.1.1.1')).rejects.toMatchObject({ status: 400 });
});
test('elimina una IP de la lista por su ID', async () => {
  const [{ idIp }] = await servicio.agregarIpPermitida('181.42.190.187');
  await servicio.agregarIpPermitida('190.100.50.20');
  const lista = await servicio.eliminarIpPermitida(idIp);
  expect(lista).toEqual([expect.objectContaining({ ip: '190.100.50.20' })]);
});
test('eliminar la última IP restaura el acceso sin restricción', async () => {
  const [{ idIp }] = await servicio.agregarIpPermitida('181.42.190.187');
  await servicio.eliminarIpPermitida(idIp);
  expect(await servicio.obtenerIpsPermitidas()).toEqual([]);
});
test('rechaza un ID de IP inválido al eliminar', async () => {
  await expect(servicio.eliminarIpPermitida('abc')).rejects.toMatchObject({ status: 400 });
});
