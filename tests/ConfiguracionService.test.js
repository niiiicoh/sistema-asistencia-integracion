const ConfiguracionService = require('../src/services/ConfiguracionService');
let servicio, valores;
beforeEach(() => {
  valores = {};
  const repo = { obtener: async clave => valores[clave] ?? null, guardar: async (clave, valor) => { valores[clave] = valor; } };
  servicio = new ConfiguracionService(repo);
});
test('sin IP guardada, obtenerIpPermitida devuelve null', async () => {
  expect(await servicio.obtenerIpPermitida()).toBeNull();
});
test('guarda y recupera una IPv4 válida', async () => {
  expect(await servicio.guardarIpPermitida('181.42.190.187')).toBe('181.42.190.187');
  expect(await servicio.obtenerIpPermitida()).toBe('181.42.190.187');
});
test('recorta espacios en la IP', async () => {
  expect(await servicio.guardarIpPermitida('  181.42.190.187  ')).toBe('181.42.190.187');
});
test('vacío o solo espacios limpia la restricción (null)', async () => {
  await servicio.guardarIpPermitida('181.42.190.187');
  await servicio.guardarIpPermitida('   ');
  expect(await servicio.obtenerIpPermitida()).toBeNull();
});
test('rechaza una IP con formato inválido', async () => {
  await expect(servicio.guardarIpPermitida('no-es-una-ip')).rejects.toMatchObject({ status: 400 });
});
test('rechaza una IPv6 (se espera IPv4)', async () => {
  await expect(servicio.guardarIpPermitida('2800:300:6a33::1')).rejects.toMatchObject({ status: 400 });
});
test('rechaza octetos fuera de rango', async () => {
  await expect(servicio.guardarIpPermitida('999.1.1.1')).rejects.toMatchObject({ status: 400 });
});
