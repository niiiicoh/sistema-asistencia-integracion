-- Ejecutar una sola vez sobre una base existente que aun no tenga la tabla configuracion.
-- Guarda ajustes clave/valor de la aplicacion (por ahora, la IP permitida para marcar asistencia).
CREATE TABLE IF NOT EXISTS configuracion (
    clave VARCHAR(50) NOT NULL,
    valor VARCHAR(255) NULL,
    CONSTRAINT pk_configuracion PRIMARY KEY (clave)
) ENGINE=InnoDB;
