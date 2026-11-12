-- backend/db/seed.sql
INSERT INTO medios_pago (nombre) VALUES ('Efectivo'), ('Mercado Pago'), ('Tarjeta Débito');
INSERT INTO mesas (numero) VALUES (1), (2), (3), (4);
CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,
    accion VARCHAR(50) NOT NULL,
    detalle TEXT NOT NULL,
    usuario_id INTEGER,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);