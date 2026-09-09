# Sistema Web de Registro y Control de Asistencia

Prototipo funcional de Integración de Competencias II, Avance 4 (Semana 5), conservando las funciones del Avance 3.
La decisión tecnológica cambió antes de implementar: se utiliza una solución web en lugar de una aplicación Java de escritorio.

## Alcance

- Inicio de sesión con correo y contraseña, y cierre de sesión.
- Administrador: crear, listar, consultar, modificar y eliminar usuarios; consultar, corregir y eliminar asistencias.
- Empleado: registrar entrada/salida y consultar únicamente sus propias marcaciones.
- Correo empresarial automático a partir del nombre y apellido.
- Registrar entrada y salida con fecha y hora generadas en el servidor.
- Consultar registros de asistencia generales o por usuario.
- Impedir la eliminación de usuarios con asistencia, conservando sus registros.
- Pruebas unitarias independientes de MySQL y pruebas HTTP con repositorios simulados.

Avance #4 implementado: RE-01 atrasos, RE-02 salidas anticipadas y RE-03 inasistencias, con filtros por fecha y empleado, acceso exclusivo de administrador y pruebas unitarias/de integración. Sin gráficos ni exportaciones.

## Tecnologías

Node.js 20 o superior, Express 5, JavaScript vanilla, HTML5, CSS3, MySQL 8+ o MariaDB, SQL, mysql2/promise, dotenv y Jest. Supertest se utiliza solamente en pruebas HTTP. Sin ORM, frameworks frontend, Docker ni JWT. Sesiones locales en memoria con cookie protegida.

## Estructura

```text
asistencia-web/
├── public/
│   ├── login.html
│   ├── index.html
│   ├── usuarios.html
│   ├── reportes.html
│   ├── asistencia.html
│   ├── css/estilos.css
│   └── js/
│       ├── login.js
│       ├── sesion.js
│       ├── comun.js
│       ├── reportes.js
│       ├── usuarios.js
│       └── asistencia.js
├── src/
│   ├── config/database.js
│   ├── models/
│   │   ├── Usuario.js
│   │   └── RegistroAsistencia.js
│   ├── repositories/
│   │   ├── ReporteRepository.js
│   │   ├── UsuarioRepository.js
│   │   └── RegistroAsistenciaRepository.js
│   ├── middleware/auth.js
│   ├── services/
│   │   ├── ReporteService.js
│   │   ├── AuthService.js
│   │   ├── UsuarioService.js
│   │   └── AsistenciaService.js
│   ├── controllers/
│   │   ├── reporteController.js
│   │   ├── usuarioController.js
│   │   └── asistenciaController.js
│   ├── routes/
│   │   ├── reporteRoutes.js
│   │   ├── usuarioRoutes.js
│   │   └── asistenciaRoutes.js
│   └── utils/
│       ├── esFechaValida.js
│       ├── correoEmpresa.js
│       ├── AppError.js
│       ├── validarId.js
│       └── password.js
├── tests/
│   ├── ReporteService.test.js
│   ├── reportes.api.test.js
│   ├── reporteFixtures.js
│   ├── UsuarioService.test.js
│   ├── AsistenciaService.test.js
│   ├── api.test.js
│   └── helpers.js
├── scripts/verificar-reportes-db.js
├── scripts/crear-admin.js
├── database/schema.sql
├── database/migrations/001_nombre_apellido.sql
├── .env.example
├── .gitignore
├── app.js
├── package.json
├── package-lock.json
├── README.md
└── VERIFICACION.md
```

Las peticiones recorren frontend → rutas/controladores → servicios → repositorios → MySQL. Los modelos representan los datos y validan sus atributos. Los servicios reciben repositorios por constructor; esto permite probarlos sin una base real. `app.js` conecta las dependencias, sirve archivos públicos y centraliza errores. Express 5 propaga los errores de controladores asíncronos al middleware.

## Actualización del proyecto existente

Para esta Semana 5 no se requiere importar SQL, crear cuentas ni ejecutar migraciones. Conservar .env y la base actual, ejecutar npm test y reiniciar npm start. El reinicio cierra las sesiones en memoria; volver a iniciar sesión.

## Instalación y ejecución (solo para una instalación nueva)

1. Abrir PowerShell en la carpeta del proyecto:

   ```powershell
   cd 'F:\Ingeniería Informática ST\Int Competencias\asistencia-web'
   npm install
   Copy-Item .env.example .env
   ```

   Si PowerShell bloquea `npm.ps1`, utilizar `npm.cmd install`, `npm.cmd start` y `npm.cmd test`.

2. Iniciar un servidor MySQL 8+ o MariaDB. MySQL Workbench es un cliente; por sí solo no inicia un servidor.

3. Crear la base ejecutando **todo** `database/schema.sql` desde MySQL Workbench o desde el cliente:

   ```powershell
   mysql -u root -p
   ```

   En la consola SQL:

   ```sql
   SOURCE F:/Ingeniería Informática ST/Int Competencias/asistencia-web/database/schema.sql;
   ```

   En XAMPP puede utilizarse `& 'C:\xampp\mysql\bin\mysql.exe' -u root -p`.
   El esquema incorpora nombre y apellido según la ampliación solicitada, conservando `ON DELETE RESTRICT` e índices.
   Los `CREATE INDEX` originales no son idempotentes: importar el esquema una vez en una base nueva; una segunda ejecución puede indicar que los índices ya existen. No eliminar tablas para resolverlo.

4. Editar `.env` según la instancia local:

   ```dotenv
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=asistencia_empresa
   DB_USER=root
   DB_PASSWORD=
   PORT=3000
   ```

   No subir este archivo a Git. `.env.example` solo incluye los valores de ejemplo solicitados.

5. En una instalación nueva, ejecutar `node scripts/crear-admin.js` para crear el primer administrador y obtener su contraseña aleatoria. En esta instancia ya está creado; el script no modifica administradores existentes. Después ejecutar:

   ```powershell
   npm start
   ```

6. Abrir <http://localhost:3000/login.html> e ingresar con las credenciales. El servidor escucha únicamente en la interfaz local. Debe aparecer `Conexión MySQL verificada.` en la terminal. Si MySQL no está disponible, la interfaz abre pero las operaciones muestran un error comprensible; no se reemplaza MySQL con datos falsos.

7. Ejecutar las pruebas en otra terminal:

   ```powershell
   npm test
   ```

Detener el servidor con Ctrl+C.

## Uso

Al iniciar sesión, el administrador accede al menú general y el empleado va directamente a Control de asistencia. Cerrar sesión elimina la sesión del servidor y la cookie.

El administrador crea usuarios ingresando nombre, apellido, contraseña y rol. El correo se asigna al guardar: Bastián Alegría produce bastian.alegria@empresa.cl. Se eliminan tildes, se utilizan minúsculas y los espacios se convierten en puntos. Para homónimos se agrega un número (bastian.alegria2@empresa.cl). No se crea un buzón de correo real: es el identificador de acceso. El correo se conserva al editar, aunque se cambie el nombre. Una contraseña vacía en el formulario de edición conserva la anterior.

Cada persona marca su propia entrada/salida; el backend toma su ID de la sesión e ignora un ID enviado por el navegador. Un empleado no puede ver registros ajenos ni modificar o eliminar registros. El administrador ve todos los registros y dispone de Editar/Eliminar. La edición permite corregir tipo, fecha y hora; no permite reasignar un registro a otra persona.

Las marcas deben alternar ENTRADA y SALIDA: no se permite una SALIDA inicial, dos ENTRADAS consecutivas ni dos SALIDAS consecutivas. Una entrada puede cerrarse al día siguiente. Se usa el orden de fecha/hora y, en caso de empate, ID. Las correcciones también deben mantener la secuencia: para eliminar un par entrada/salida, eliminar primero la salida y después la entrada. Un cambio que deje una salida huérfana o dos entradas devuelve 409.

Las operaciones sobre un mismo usuario bloquean su fila dentro de una transacción MySQL antes de consultar, validar y guardar. Esto impide entradas duplicadas por peticiones simultáneas. Las marcas normales usan la fecha/hora local del servidor; solo el administrador puede corregirlas explícitamente. Configurar la zona horaria del sistema operativo en Santiago si corresponde.

## API

| Método | Ruta | Resultado |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión con correo y contraseña |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Identidad autenticada |
| GET | `/api/usuarios` | Lista de usuarios |
| GET | `/api/usuarios/:id` | Usuario por ID |
| POST | `/api/usuarios` | Crear usuario (201) |
| PUT | `/api/usuarios/:id` | Actualizar campos enviados |
| DELETE | `/api/usuarios/:id` | Eliminar sin borrar asistencias |
| POST | `/api/asistencia/entrada` | Registrar entrada (201) |
| POST | `/api/asistencia/salida` | Registrar salida (201) |
| GET | `/api/asistencia` | Admin: todos; empleado: propios |
| PUT | `/api/asistencia/:id` | Admin: corregir tipo, fecha y hora |
| DELETE | `/api/asistencia/:id` | Admin: eliminar manteniendo la secuencia |
| GET | `/api/asistencia/usuario/:id` | Registros del usuario |

Creación de usuario:

```json
{ "nombre": "Ana", "apellido": "Pérez", "contrasena": "mi-clave", "rol": "EMPLEADO" }
```

Entrada o salida:

```json
{}
```

Todas las rutas de usuarios requieren administrador. Las rutas de asistencia requieren sesión. Login recibe correo y contrasena. La API ignora ID, fecha, hora o tipo de marca enviados por el cliente al marcar. Las rutas de entrada/salida definen el tipo. Los errores tienen forma `{ "mensaje": "Descripción comprensible" }` y códigos 400 (validación), 404 (no encontrado), 409 (duplicado o restricción referencial) 401 (sin sesión o credenciales incorrectas), 403 (sin permisos/origen inválido), 429 (demasiados intentos de login) o 500 (error interno). Las consultas exitosas, modificaciones y eliminaciones responden 200.

## Seguridad y límites

Las consultas utilizan parámetros `?`. Se normaliza el correo, se validan ID, roles y campos, y las contraseñas se almacenan con `scrypt` y sal aleatoria mediante `node:crypto`. `Usuario.toJSON()` excluye la contraseña incluso cuando está cifrada mediante hash. El frontend inserta datos mediante `textContent`, sin interpretar HTML recibido. Solo `public/` se expone como contenido estático. Los errores no incluyen stack traces ni información interna de MySQL.

Las sesiones tienen un token aleatorio de 256 bits, duran 8 horas y se guardan en memoria: reiniciar Node cierra las sesiones. Cookie HttpOnly y SameSite=Strict, Secure en NODE_ENV=production (requiere HTTPS). La identidad y el rol se consultan en la base en cada petición; cambiar contraseña o eliminar el usuario invalida sus sesiones. Se limita el login a 10 intentos por minuto por IP, se verifica el origen en escrituras y se exige JSON. Es un prototipo local de un solo proceso; no tiene recuperación de contraseña, auditoría de correcciones ni paginación.

## Pruebas

Las pruebas Jest usan repositorios simulados y no necesitan MySQL. Cubren usuarios, generación de correos, autenticación, cierre de sesión, permisos, privacidad de marcaciones, alternancia, edición/eliminación administrativa, validaciones y manejo de errores. El conjunto tiene 88 pruebas en 5 suites: conserva las 47 pruebas anteriores y agrega 41 de reportes. La concurrencia se verificó adicionalmente contra MariaDB real. Consulta VERIFICACION.md.

## Ampliación: nombre y apellido

Nombre y apellido son obligatorios al crear o guardar una edición, admiten hasta 100 caracteres cada uno y conservan acentos y espacios interiores. Se muestran en Gestión de usuarios y en los filtros y resultados de reportes.

Para una base nueva, utilizar el schema.sql actualizado. Para una base con el esquema original, ejecutar una sola vez database/migrations/001_nombre_apellido.sql antes de reiniciar Node. No ejecutar la migración sobre una base ya actualizada. La instancia local en el puerto 3307 ya fue migrada.

Ambas columnas permiten NULL únicamente para conservar datos históricos sin inventar identidades. En la interfaz aparecen como Pendiente; completar ambos campos al editar esos usuarios. La API exige ambos datos para nuevas altas y para guardar ediciones de registros históricos. La migración conserva IDs, contraseñas y asistencias.

## Avance #4: reportes (Semana 5)

Solo el administrador puede abrir Reportes y consultar sus endpoints. Se reutilizan la sesión existente y el middleware admin: anónimo recibe 401 en API y empleado recibe 403, incluso con URL directa. La página requiere login y devuelve 403 a empleados.

| Reporte | Regla exacta |
|---|---|
| RE-01 Atrasos | ENTRADA con hora > 09:30:00. 09:30:00 queda fuera; 09:30:01 entra. |
| RE-02 Salidas anticipadas | SALIDA con hora < 17:30:00. 17:30:00 queda fuera; 17:29:59 entra. |
| RE-03 Inasistencias | Usuario con rol actual EMPLEADO sin ninguna ENTRADA ni SALIDA en la fecha. |

Endpoints GET:

- /api/reportes/atrasos
- /api/reportes/salidas-anticipadas
- /api/reportes/inasistencias

Todos requieren desde=YYYY-MM-DD y hasta=YYYY-MM-DD; idUsuario es opcional y debe pertenecer a un EMPLEADO existente. Ejemplo: /api/reportes/atrasos?desde=2026-09-01&hasta=2026-09-30&idUsuario=5. Ambas fechas son inclusivas. Se validan fechas reales, orden del rango e ID; se devuelve 400 por filtro inválido y 404 por empleado inexistente. No hay límite arbitrario de duración del rango; las fechas deben pertenecer al dominio DATE de la base (1000-01-01 a 9999-12-31).

La respuesta es un arreglo de objetos con idUsuario, nombre, apellido, correo y fecha; atrasos y salidas incluyen hora. Se ordena por fecha descendente, nombre y apellido. Los valores históricos se conservan: la API mantiene NULL y la interfaz lo presenta como Pendiente. No se seleccionan contraseñas ni hashes.

RE-01 y RE-02 consideran las marcas que cumplen su regla, incluyendo las de administradores si no se aplica filtro. RE-03 excluye siempre administradores. Cada marcación se evalúa por separado; no se agrupan varias entradas de un día como un único atraso. Las correcciones administrativas se reflejan al volver a generar el reporte porque no se guarda una copia calculada.

### Límites de interpretación de inasistencias

No se descuentan feriados ni fines de semana; no se consideran permisos, vacaciones o justificaciones y no hay tabla de calendario laboral. Todos los días del rango elegido se comparan con ausencia total de marcas. Una sola salida basta para excluir ese día, incluso si cierra una entrada del día anterior. La base no tiene fecha de contratación ni historial de roles, por lo que se utiliza el conjunto actual de empleados para todo el rango. El administrador debe elegir un rango pertinente; no se inventa una fecha de contratación ni se excluyen fechas futuras.

No se agregan tablas, tipos de marca, índices ni migraciones. Las consultas son parametrizadas y reutilizan el índice (id_usuario, fecha). Las fechas para inasistencias se envían en lotes internos de 500 días mediante una tabla derivada y NOT EXISTS; esto evita truncar resultados por límites de recursión SQL. El tamaño de lote no limita el rango permitido. Rangos muy grandes pueden producir muchos resultados; no se agrega paginación en este avance.

### Verificación adicional de SQL real

npm test ejecuta las pruebas unitarias y HTTP con repositorios en memoria, sin necesitar MySQL. Para comprobar también las consultas reales:

    node scripts/verificar-reportes-db.js

Requiere la conexión .env disponible y permiso CREATE TEMPORARY TABLES. Crea únicamente tablas temporales de conexión que ocultan las tablas originales durante la prueba, inserta fixtures allí y las descarta al finalizar. No escribe ni borra registros persistentes. Verifica umbrales, tipos, filtros, nombres históricos, correcciones, ausencia con una sola salida y rangos superiores a 1.000 días. Los 47 tests previos conservan sus archivos y siguen pasando.
#   s i s t e m a - a s i s t e n c i a - i n t e g r a c i o n  
 #   s i s t e m a - a s i s t e n c i a - i n t e g r a c i o n  
 #   s i s t e m a - a s i s t e n c i a - i n t e g r a c i o n  
 