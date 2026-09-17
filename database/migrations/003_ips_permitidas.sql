-- Ejecutar una sola vez sobre una base existente que aun no tenga la tabla ips_permitidas.
-- Reemplaza la restriccion de red de una sola IP (tabla configuracion) por una lista de IPs
-- permitidas (por ejemplo, una por cada oficina). Migra la IP ya configurada, si existia.
CREATE TABLE IF NOT EXISTS ips_permitidas (
    id_ip INT UNSIGNED AUTO_INCREMENT,
    ip VARCHAR(15) NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ips_permitidas PRIMARY KEY (id_ip),
    CONSTRAINT uq_ips_permitidas_ip UNIQUE (ip)
) ENGINE=InnoDB;

INSERT IGNORE INTO ips_permitidas (ip)
SELECT valor FROM configuracion WHERE clave = 'ip_permitida_asistencia' AND valor IS NOT NULL;
