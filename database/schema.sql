CREATE DATABASE IF NOT EXISTS asistencia_empresa
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE asistencia_empresa;

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT UNSIGNED AUTO_INCREMENT,
    nombre VARCHAR(100) NULL,
    apellido VARCHAR(100) NULL,
    correo VARCHAR(150) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('EMPLEADO', 'ADMINISTRADOR') NOT NULL DEFAULT 'EMPLEADO',
    CONSTRAINT pk_usuarios PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS registros_asistencia (
    id_registro BIGINT UNSIGNED AUTO_INCREMENT,
    id_usuario INT UNSIGNED NOT NULL,
    tipo_registro ENUM('ENTRADA', 'SALIDA') NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    CONSTRAINT pk_registros_asistencia PRIMARY KEY (id_registro),
    CONSTRAINT fk_registro_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_registro_usuario_fecha
    ON registros_asistencia (id_usuario, fecha);

CREATE INDEX idx_registro_fecha_tipo
    ON registros_asistencia (fecha, tipo_registro);

CREATE TABLE IF NOT EXISTS configuracion (
    clave VARCHAR(50) NOT NULL,
    valor VARCHAR(255) NULL,
    CONSTRAINT pk_configuracion PRIMARY KEY (clave)
) ENGINE=InnoDB;
