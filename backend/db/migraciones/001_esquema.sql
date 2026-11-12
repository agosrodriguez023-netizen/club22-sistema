-- backend/db/migraciones/001_esquema.sql
DROP TABLE IF EXISTS usuario, usuarios, productos, medios_pago, mesas CASCADE;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE productos (
    codigo VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    precio_mostrador INTEGER NOT NULL,
    precio_mesa INTEGER NOT NULL,
    stock_actual INTEGER DEFAULT 0,
    controla_stock BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE medios_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE mesas (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    estado VARCHAR(20) DEFAULT 'LIBRE'
);