# Reporte de testing — Sistema de Asistencia

**Fecha:** 2026-09-18
**Entorno:** Local (Windows, MariaDB 10.4 vía XAMPP, Node.js, servidor en `http://localhost:3000`)
**Usuario admin usado en las pruebas:** `administrador.sistema@empresa.cl`
**Herramientas:** Jest + Supertest (suite del proyecto) y Playwright (pruebas de extremo a extremo en navegador Chromium headless)

## Resumen ejecutivo

| Suite | Resultado |
|---|---|
| `npm test` (Jest, unitarias + HTTP con repos simulados) | ✅ **111/111** pruebas pasadas, 6 suites |
| Playwright E2E (navegador real, contra el servidor local con MySQL real) | ✅ **26/26** pasos pasados |

No se encontraron defectos funcionales en el flujo probado. Se encontró y corrigió **una condición de carrera en el propio script de prueba** (no en la aplicación) — se detalla en la sección de incidencias.

---

## 1. Suite Jest (`npm test`)

```
Test Suites: 6 passed, 6 total
Tests:       111 passed, 111 total
Time:        ~11-23 s
```

Cubre (según el propio código del repo): usuarios, generación de correos, autenticación, cierre de sesión, permisos, privacidad de marcaciones, alternancia entrada/salida, edición/eliminación administrativa (incluida la eliminación forzada de usuarios con asistencia), reportes, y restricción de red por IP.

## 2. Pruebas E2E en navegador (Playwright)

Se automatizó un flujo completo simulando a un administrador y a un empleado reales usando la interfaz web (no solo la API). Los 26 pasos, en orden:

| # | Paso | Resultado | Detalle |
|---|---|---|---|
| 1 | Login con credenciales inválidas muestra error | ✅ | Mensaje: "Correo o contraseña incorrectos." |
| 2 | Login admin válido redirige a Inicio | ✅ | Redirige a `/` |
| 3 | Dashboard Inicio carga estadísticas | ✅ | Contadores animados visibles, nav de Usuarios visible para admin |
| 4 | Crear usuario empleado de prueba (Zeta Pruebita) | ✅ | Correo autogenerado: `zeta.pruebita@empresa.cl` |
| 5 | El usuario aparece en la tabla con sus datos | ✅ | Nombre, apellido, correo y rol correctos |
| 6 | Editar usuario conserva el correo | ✅ | Correo se mantiene igual tras cambiar el nombre |
| 7 | Cerrar sesión admin vuelve a login | ✅ | |
| 8 | Login como el empleado redirige directo a Asistencia | ✅ | No ve el link "Usuarios" en el menú |
| 9 | Empleado no accede a `/usuarios.html` por URL directa | ✅ | Redirige de vuelta a `/asistencia.html` |
| 10 | Empleado no accede a `/reportes.html` por URL directa | ✅ | No se queda en esa página |
| 11 | Empleado registra ENTRADA | ✅ | Mensaje de confirmación con fecha/hora del servidor |
| 12 | Tras la entrada, botón "Entrada" se deshabilita y "Salida" se habilita | ✅ | |
| 13 | Empleado registra SALIDA | ✅ | (ver incidencia #1 más abajo) |
| 14 | El resumen semanal del empleado se actualiza | ✅ | Días trabajados y horas calculadas |
| 15 | Marcar dos ENTRADAs sin SALIDA de por medio es rechazado | ✅ | La API devuelve 409 "Ya existe una entrada sin salida..." |
| 16 | Logout empleado | ✅ | |
| 17 | `/red.html` sin sesión redirige a login (no queda expuesta) | ✅ | |
| 18 | Login admin de nuevo | ✅ | |
| 19 | Reportes: generar "Atrasos" | ✅ | 2 resultados en los últimos 30 días |
| 20 | Reportes: generar "Salidas anticipadas" | ✅ | 0 resultados |
| 21 | Reportes: generar "Inasistencias" | ✅ | 30 resultados |
| 22 | Reportes: rango de fechas invertido devuelve error controlado | ✅ | HTTP 400 con mensaje claro |
| 23 | Red: agregar una IP permitida | ✅ | Se refleja al instante en la lista |
| 24 | Red: eliminar la IP (limpieza) | ✅ | |
| 25 | Eliminar usuario con asistencia exige confirmación reforzada | ✅ | Primer aviso normal → segundo aviso explícito de que se borra todo → se elimina |
| 26 | Logout final | ✅ | |

Capturas de pantalla guardadas en `testing/screenshots/` (dashboard admin, usuario creado, vista de empleado, resumen semanal, los 3 reportes, la IP agregada y la eliminación del usuario de prueba).

Datos crudos paso a paso: `testing/resultados.json`.

---

## 3. Incidencias encontradas durante el testing

### Incidencia #1 — Falsa alarma en la primera corrida (corregida, no es un bug de la app)

En la primera ejecución, el paso 13 ("Empleado registra SALIDA") falló: el mensaje leído en pantalla todavía decía "Entrada registrada" en vez de "Salida registrada". Se investigó antes de reportarlo como defecto:

- El paso 15 (que corrió después) confirmó vía la propia API que la SALIDA sí quedó guardada correctamente (la siguiente ENTRADA de prueba fue rechazada con 409 solo porque ya existía una nueva entrada pendiente, lo cual solo es posible si la salida anterior se había registrado bien).
- La causa real: el script de prueba esperaba a que el cartel de mensaje **estuviera visible**, pero ya estaba visible desde el mensaje anterior ("Entrada registrada"), así que leyó el texto viejo antes de que se actualizara — un problema de sincronización del test, no de la aplicación.
- Se corrigió el script para esperar a que el texto del mensaje **cambie realmente** antes de leerlo, y se corrió la suite completa de nuevo: los 26 pasos pasaron limpio.

**Conclusión:** no hay ningún defecto real aquí; se deja documentado por transparencia.

### Observación — El `README.md` quedó desactualizado frente al código actual

Durante la exploración previa a escribir las pruebas se notó que el proyecto creció bastante más allá de lo que describe el `README.md` (que sigue hablando del "Avance #4"), y no menciona funciones que sí existen y funcionan (confirmado por estas pruebas):

- Página **"Red"** para restringir por IP pública desde qué redes se puede marcar entrada/salida (con lista de IPs, no solo una).
- **Gráficos** en Inicio, Asistencia y Reportes (marcaciones por día, puntualidad, resumen semanal por empleado) — el README dice explícitamente "Sin gráficos ni exportaciones".
- **Descarga de reportes en Word**.
- **Eliminación forzada** de un usuario con asistencia (antes el README decía que esto se impedía siempre; ahora se permite con una confirmación explícita de que se borra todo).

Esto no es un defecto de la aplicación (todo funcionó correctamente en las pruebas), pero conviene actualizar el README para que describa el estado real del sistema. Puedo encargarme de eso si quieres.

---

## 4. Cómo reproducir

```powershell
# 1. Base de datos (MariaDB/XAMPP corriendo)
mysql -u root < database/schema.sql   # o las migraciones si ya existe una base antigua

# 2. Servidor
npm install
npm start

# 3. Pruebas unitarias/integración
npm test

# 4. Pruebas E2E (requieren Python + Playwright instalados)
pip install playwright
python -m playwright install chromium
python testing/test_app.py
```

El script de Playwright usado está guardado en `testing/test_app.py` dentro de este mismo repo para poder volver a correrlo cuando quieras.
