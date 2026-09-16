# Verificación del Avance 3

Comprobaciones realizadas el 9 de septiembre de 2026.

- `npm install`: correcto; 373 paquetes instalados, auditoría sin vulnerabilidades reportadas.
- `npm test`: **3 suites y 44 pruebas aprobadas**, sin una base de datos real.
- `npm start`: arranque correcto en http://localhost:3000 y conexión MySQL verificada.
- Esquema SQL completo importado sin cambios en MariaDB 10.4.32, en una instancia aislada en el puerto 3307. Comprobadas ambas tablas y los índices solicitados.
- API conectada a MariaDB: creación, consulta individual, listado, edición, correo duplicado y eliminación de usuario sin asistencias verificados.
- Entrada y salida persistidas con tipo correcto, usuario correcto y fecha/hora del servidor; valores de fecha/hora enviados por el cliente ignorados.
- Consultas de asistencia general y por usuario verificadas.
- Eliminación de usuario con asistencias: HTTP 409 y ambos registros conservados.
- Contraseña persistida con hash scrypt y excluida de respuestas.
- Las tres páginas y sus recursos responden HTTP 200.
- En el navegador se verificaron navegación, estado vacío, creación de usuario, edición conservando contraseña y aparición de la confirmación de eliminación.
- La automatización del navegador se bloqueó en el diálogo nativo de confirmación. La eliminación efectiva y las marcas fueron verificadas mediante HTTP contra MariaDB, no mediante clics completos en el navegador. La revisión visual móvil no se ejecutó.
- No se implementaron funcionalidades de Semana 5.

## Entorno local preparado

Se creó `.env` (ignorado por Git) con `DB_HOST=127.0.0.1` y `DB_PORT=3307`. `.env.example` conserva los valores solicitados. La instancia de prueba utiliza `C:\Users\nicob\.codex\asistencia-web-mariadb-test`; no modifica los datos existentes de XAMPP. Queda un usuario ficticio de la comprobación de interfaz: `prueba-editada@ejemplo.cl`.

El servidor Node y MariaDB quedaron iniciados en segundo plano. Tras reiniciar el equipo, iniciar primero esta instancia de MariaDB en PowerShell:

```powershell
Start-Process -FilePath 'C:\xampp\mysql\bin\mysqld.exe' -ArgumentList '--defaults-file=C:\Users\nicob\.codex\asistencia-web-mariadb-test\my.ini','--bind-address=127.0.0.1' -WindowStyle Hidden
```

Luego ejecutar `npm start` dentro de la carpeta del proyecto. No volver a importar el esquema en esta instancia: ya está creado. Para usar una instancia propia, seguir el README y ajustar `.env`.

Comprobación posterior al reinicio de los procesos: `/` y `/api/usuarios` respondieron HTTP 200.

## Ampliación de nombre y apellido

Migración aplicada a MariaDB local conservando el usuario existente y el total de asistencias. Verificado mediante API real: crear con nombre/apellido, consultar su persistencia, editar ambos, rechazar datos ausentes o vacíos y eliminar el usuario temporal. Formulario servido con ambos campos. npm test: 53 pruebas aprobadas en 3 suites. Servidor reiniciado con los cambios.

## Login, permisos y reglas de asistencia

Actualización: 47 pruebas Jest aprobadas en 3 suites; las expectativas anteriores sin login y sin alternancia fueron sustituidas por el comportamiento solicitado. Verificado con MariaDB real: login/logout, roles, privacidad por usuario, correo automático y homónimos, bloqueo de salida inicial y duplicados, edición/eliminación administrativa. Dos solicitudes simultáneas de entrada devolvieron 201 y 409, con una única marca persistida.

Se eliminaron las 13 asistencias existentes por solicitud expresa. Las marcas de verificación también fueron retiradas, dejando 0 registros. Se conservó el usuario existente y se creó administrador.sistema@empresa.cl. La contraseña aleatoria se entrega en la conversación y solo se almacena como hash en la base. No se incluyen credenciales reales en archivos del proyecto.

Login del administrador y menú de gestión comprobados en navegador. El correo se asigna al guardar; el campo se mantiene de solo lectura. Servidor activo en el puerto 3000.

## Avance #4 · Semana 5

Resultado: 88 pruebas aprobadas en 5 suites; 47 previas conservadas y 41 nuevas. Los archivos originales de pruebas no se modificaron. SQL real verificado con tablas TEMPORARY de conexión: umbrales exactos, tipos, filtros, inasistencias, correcciones y 1.462 días sin truncamiento. Sin migraciones ni modificaciones de usuarios o asistencias persistentes. npm start inició correctamente y confirmó la conexión MySQL. Se reutilizó la validación de fecha de correcciones mediante esFechaValida, sin cambiar sus condiciones.
