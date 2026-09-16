-- Ejecutar una sola vez sobre una base existente con el esquema original.
-- NULL preserva usuarios históricos sin inventar nombres. La aplicación exige
-- ambos campos al crear o guardar una edición.
USE asistencia_empresa;
ALTER TABLE usuarios
    ADD COLUMN nombre VARCHAR(100) NULL AFTER id_usuario,
    ADD COLUMN apellido VARCHAR(100) NULL AFTER nombre;
