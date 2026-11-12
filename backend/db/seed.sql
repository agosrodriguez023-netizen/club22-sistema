-- backend/db/seed.sql 
-- 1. Medios de pago
INSERT INTO medios_pago (nombre, activo) VALUES 
('Efectivo', true), 
('Mercado Pago', true), 
('Tarjeta Débito', true);

-- 2. Mesas
INSERT INTO mesas (numero, estado) VALUES 
(1, 'LIBRE'), 
(2, 'LIBRE'), 
(3, 'LIBRE'), 
(4, 'LIBRE');

-- 3. Productos (Catálogo de 28 ítems adaptado a la tabla de Agostina)
INSERT INTO productos (codigo, nombre, categoria, precio_mostrador, precio_mesa, stock_actual, controla_stock, activo) VALUES 
-- Vinos
('7790009000011', 'Santa Julia Malbec 750 ml', 'Vinos', 7900, 11500, 24, true, true),
('7790009000028', 'Alamos Malbec 750 ml', 'Vinos', 11200, 16500, 18, true, true),
('7790009000035', 'Trapiche Medalla Malbec 750 ml', 'Vinos', 19800, 28500, 10, true, true),
('7790009000042', 'Luigi Bosca Malbec 750 ml', 'Vinos', 23500, 33900, 8, true, true),
('7790009000059', 'Norton Lote Negro 750 ml', 'Vinos', 16900, 24500, 10, true, true),
('7790009000066', 'El Esteco Don David Torrontés 750 ml', 'Vinos', 13500, 19500, 12, true, true),
('7790009000073', 'Rutini Cabernet-Malbec 750 ml', 'Vinos', 38500, 52000, 6, true, true),
('COPA-VINO-CASA', 'Copa de vino de la casa (Malbec)', 'Vinos', 0, 5200, 0, false, true),

-- Espumantes
('7790009000097', 'Chandon Extra Brut 750 ml', 'Espumantes', 21900, 31500, 12, true, true),
('7790009000103', 'Baron B Extra Brut 750 ml', 'Espumantes', 42000, 58000, 4, true, true),

-- Cervezas
('7790009000110', 'Patagonia Amber Lager 730 ml', 'Cervezas', 5600, 8200, 36, true, true),
('7790009000127', 'Quilmes Clásica 1 L', 'Cervezas', 3900, 5900, 48, true, true),
('7790009000134', 'Andes Origen Roja lata 473 ml', 'Cervezas', 2900, 4300, 48, true, true),
('7790009000141', 'Stella Artois 330 ml', 'Cervezas', 3100, 4800, 48, true, true),
('7790009000158', 'Corona 330 ml', 'Cervezas', 3400, 5200, 36, true, true),
('PINTA-IPA-CASA', 'Pinta tirada (IPA de la casa)', 'Cervezas', 0, 6500, 0, false, true),

-- Tragos
('TRAG-FERNET', 'Fernet con Coca', 'Tragos', 0, 7800, 0, false, true),
('TRAG-APEROL', 'Aperol Spritz', 'Tragos', 0, 9500, 0, false, true),
('TRAG-GIN', 'Gin Tonic', 'Tragos', 0, 9900, 0, false, true),
('TRAG-CAMPARI', 'Campari con naranja', 'Tragos', 0, 7900, 0, false, true),
('TRAG-NEGRONI', 'Negroni', 'Tragos', 0, 10500, 0, false, true),

-- Picadas
('PICADA-2', 'Picada para 2', 'Picadas', 0, 18500, 0, false, true),
('PICADA-4', 'Picada para 4', 'Picadas', 0, 32000, 0, false, true),
('TABLA-QUESOS', 'Tabla de quesos', 'Picadas', 0, 15900, 0, false, true),
('PORC-MANI', 'Porción de maní y aceitunas', 'Picadas', 0, 4500, 0, false, true),

-- Sin alcohol
('7790009000264', 'Agua mineral 500 ml', 'Sin alcohol', 1800, 3200, 48, true, true),
('7790009000271', 'Coca-Cola 500 ml', 'Sin alcohol', 2400, 3900, 48, true, true),

-- Almacén
('7790009000288', 'Bolsa de hielo 2 kg', 'Almacén', 2500, 0, 20, true, true);