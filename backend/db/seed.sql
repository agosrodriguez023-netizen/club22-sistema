-- backend/db/seed.sql · Datos de ejemplo de Club 22 (productos, medios de pago, mesas, proveedores, promociones, pedidos)
-- Correr DESPUÉS de 001 y 002. Se puede correr más de una vez sin duplicar datos.
-- Los usuarios NO van acá: los crea el script de Agostina (así las contraseñas quedan cifradas).
-- [A CONFIRMAR] con el catálogo, los precios y el salón reales de la Dirección.

BEGIN;

-- ---------- Productos ----------
-- El código es el código de barras de prueba; los productos sin código de barras llevan un código interno.
-- Precio 0 = ese producto no se vende en ese destino.
INSERT INTO productos (codigo, nombre, categoria, precio_mostrador, precio_mesa, stock_actual, stock_minimo, controla_stock, activo) VALUES
  ('7790009000011', 'Santa Julia Malbec 750 ml',            'Vinos',       7900, 11500, 24, 6,  TRUE,  TRUE),
  ('7790009000028', 'Alamos Malbec 750 ml',                 'Vinos',      11200, 16500, 18, 6,  TRUE,  TRUE),
  ('7790009000035', 'Trapiche Medalla Malbec 750 ml',       'Vinos',      19800, 28500, 10, 4,  TRUE,  TRUE),
  ('7790009000042', 'Luigi Bosca Malbec 750 ml',            'Vinos',      23500, 33900,  8, 3,  TRUE,  TRUE),
  ('7790009000059', 'Norton Lote Negro 750 ml',             'Vinos',      16900, 24500, 10, 4,  TRUE,  TRUE),
  ('7790009000066', 'El Esteco Don David Torrontés 750 ml', 'Vinos',      13500, 19500, 12, 4,  TRUE,  TRUE),
  ('7790009000073', 'Rutini Cabernet-Malbec 750 ml',        'Vinos',      38500, 52000,  6, 2,  TRUE,  TRUE),
  ('VINO-CASA',     'Copa de vino de la casa (Malbec)',     'Vinos',          0,  5200,  0, 0,  FALSE, TRUE),
  ('7790009000097', 'Chandon Extra Brut 750 ml',            'Espumantes', 21900, 31500, 12, 4,  TRUE,  TRUE),
  ('7790009000103', 'Baron B Extra Brut 750 ml',            'Espumantes', 42000, 58000,  4, 2,  TRUE,  TRUE),
  ('7790009000110', 'Patagonia Amber Lager 730 ml',         'Cervezas',    5600,  8200, 36, 12, TRUE,  TRUE),
  ('7790009000127', 'Quilmes Clásica 1 L',                  'Cervezas',    3900,  5900, 48, 12, TRUE,  TRUE),
  ('7790009000134', 'Andes Origen Roja lata 473 ml',        'Cervezas',    2900,  4300, 48, 24, TRUE,  TRUE),
  ('7790009000141', 'Stella Artois 330 ml',                 'Cervezas',    3100,  4800, 48, 24, TRUE,  TRUE),
  ('7790009000158', 'Corona 330 ml',                        'Cervezas',    3400,  5200, 36, 12, TRUE,  TRUE),
  ('PINTA-IPA',     'Pinta tirada (IPA de la casa)',        'Cervezas',       0,  6500,  0, 0,  FALSE, TRUE),
  ('TRAGO-FERNET',  'Fernet con Coca',                      'Tragos',         0,  7800,  0, 0,  FALSE, TRUE),
  ('TRAGO-APEROL',  'Aperol Spritz',                        'Tragos',         0,  9500,  0, 0,  FALSE, TRUE),
  ('TRAGO-GIN',     'Gin Tonic',                            'Tragos',         0,  9900,  0, 0,  FALSE, TRUE),
  ('TRAGO-CAMPARI', 'Campari con naranja',                  'Tragos',         0,  7900,  0, 0,  FALSE, TRUE),
  ('TRAGO-NEGRONI', 'Negroni',                              'Tragos',         0, 10500,  0, 0,  FALSE, TRUE),
  ('PICADA-2',      'Picada para 2',                        'Picadas',        0, 18500,  0, 0,  FALSE, TRUE),
  ('PICADA-4',      'Picada para 4',                        'Picadas',        0, 32000,  0, 0,  FALSE, TRUE),
  ('PICADA-QUESOS', 'Tabla de quesos',                      'Picadas',        0, 15900,  0, 0,  FALSE, TRUE),
  ('PICADA-MANI',   'Porción de maní y aceitunas',          'Picadas',        0,  4500,  0, 0,  FALSE, TRUE),
  ('7790009000264', 'Agua mineral 500 ml',                  'Sin alcohol', 1800,  3200, 48, 12, TRUE,  TRUE),
  ('7790009000271', 'Coca-Cola 500 ml',                     'Sin alcohol', 2400,  3900, 48, 12, TRUE,  TRUE),
  ('7790009000288', 'Bolsa de hielo 2 kg',                  'Almacén',     2500,     0, 20, 5,  TRUE,  TRUE)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre, categoria = EXCLUDED.categoria,
  precio_mostrador = EXCLUDED.precio_mostrador, precio_mesa = EXCLUDED.precio_mesa,
  stock_actual = EXCLUDED.stock_actual, stock_minimo = EXCLUDED.stock_minimo,
  controla_stock = EXCLUDED.controla_stock, activo = EXCLUDED.activo;

-- ---------- Medios de pago ----------
INSERT INTO medio_de_pago (nombre, es_efectivo, activo)
SELECT v.nombre, v.es_efectivo, TRUE
  FROM (VALUES ('Efectivo', TRUE), ('Débito', FALSE), ('Crédito', FALSE),
               ('Transferencia', FALSE), ('QR', FALSE)) AS v(nombre, es_efectivo)
 WHERE NOT EXISTS (SELECT 1 FROM medio_de_pago m WHERE m.nombre = v.nombre);

-- ---------- Mesas ----------
INSERT INTO mesa (etiqueta, capacidad, ubicacion, observaciones) VALUES
  ('Barra alta 1', 2, 'Barra',  'Banquetas altas'),
  ('Barra alta 2', 2, 'Barra',  'Banquetas altas'),
  ('Ventana 1',    2, 'Salón',  'Junto a la vidriera'),
  ('Ventana 2',    4, 'Salón',  'Junto a la vidriera'),
  ('Salón 1',      4, 'Salón',  NULL),
  ('Salón 2',      4, 'Salón',  NULL),
  ('Salón 3',      6, 'Salón',  'Se puede unir con Salón 2'),
  ('Cava',         8, 'Salón',  'Mesa larga para grupos y degustaciones'),
  ('Vereda 1',     4, 'Vereda', 'Sujeta al clima'),
  ('Vereda 2',     4, 'Vereda', 'Sujeta al clima')
ON CONFLICT (etiqueta) DO NOTHING;

-- ---------- Proveedores (ficticios) ----------
INSERT INTO proveedor (nombre, telefono)
SELECT v.nombre, v.telefono
  FROM (VALUES ('Distribuidora Cuyo Vinos S.R.L.', '351 000-0001'),
               ('Bebidas del Centro S.A.',         '351 000-0002'),
               ('Hielo Polar Córdoba',             '351 000-0003')) AS v(nombre, telefono)
 WHERE NOT EXISTS (SELECT 1 FROM proveedor p WHERE p.nombre = v.nombre);

-- ---------- Promociones (las crea el primer Administrador) ----------
INSERT INTO promocion (nombre, tipo, porcentaje, categoria, producto_codigo, fecha_desde, fecha_hasta,
                       dias_semana, hora_desde, hora_hasta, creado_por)
SELECT v.nombre, v.tipo, v.porcentaje, v.categoria, v.producto_codigo,
       v.desde, v.hasta, v.dias, v.hora_desde, v.hora_hasta,
       (SELECT id FROM usuarios WHERE rol = 'ADMINISTRADOR' ORDER BY id LIMIT 1)
  FROM (VALUES
    ('Happy Hour (Cervezas)',  'HAPPY_HOUR', 20, 'Cervezas',   NULL::varchar,
       date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month - 1 day')::date,
       '{1,2,3,4}'::smallint[], TIME '18:00', TIME '21:00'),
    ('Happy Hour (Tragos)',    'HAPPY_HOUR', 20, 'Tragos',     NULL::varchar,
       date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month - 1 day')::date,
       '{1,2,3,4}'::smallint[], TIME '18:00', TIME '21:00'),
    ('Malbec de la semana',    'PORCENTAJE', 15, NULL,         '7790009000028',
       now()::date, (now() + interval '6 days')::date,
       '{0,1,2,3,4,5,6}'::smallint[], NULL::time, NULL::time),
    ('Jueves de espumantes',   'PORCENTAJE', 10, 'Espumantes', NULL::varchar,
       date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month - 1 day')::date,
       '{4}'::smallint[], NULL::time, NULL::time)
  ) AS v(nombre, tipo, porcentaje, categoria, producto_codigo, desde, hasta, dias, hora_desde, hora_hasta)
 WHERE NOT EXISTS (SELECT 1 FROM promocion p WHERE p.nombre = v.nombre)
   AND EXISTS (SELECT 1 FROM usuarios WHERE rol = 'ADMINISTRADOR');

-- ---------- Pedidos a proveedores: uno pendiente y uno entregado (solo si todavía no hay pedidos) ----------
DO $$
DECLARE
  admin_id INTEGER;
  pedido_id INTEGER;
BEGIN
  SELECT id INTO admin_id FROM usuarios WHERE rol = 'ADMINISTRADOR' ORDER BY id LIMIT 1;
  IF admin_id IS NULL OR EXISTS (SELECT 1 FROM pedido_proveedor) THEN
    RETURN;
  END IF;

  -- Pendiente: para mostrar el ingreso de mercadería con remito
  INSERT INTO pedido_proveedor (proveedor_id, estado, usuario_id, observaciones)
  VALUES ((SELECT id FROM proveedor WHERE nombre LIKE 'Distribuidora Cuyo%'), 'PEDIDO', admin_id, 'Reposición de vinos')
  RETURNING id INTO pedido_id;
  INSERT INTO detalle_pedido (pedido_id, producto_codigo, cantidad_pedida) VALUES
    (pedido_id, '7790009000073', 12),
    (pedido_id, '7790009000103', 6);

  -- Entregado la semana anterior
  INSERT INTO pedido_proveedor (proveedor_id, estado, fecha_pedido, fecha_entrega, numero_remito, usuario_id)
  VALUES ((SELECT id FROM proveedor WHERE nombre LIKE 'Bebidas del Centro%'), 'ENTREGADO',
          now() - interval '8 days', now() - interval '7 days', 'R-0001-00001234', admin_id)
  RETURNING id INTO pedido_id;
  INSERT INTO detalle_pedido (pedido_id, producto_codigo, cantidad_pedida, cantidad_recibida) VALUES
    (pedido_id, '7790009000127', 48, 48),
    (pedido_id, '7790009000271', 48, 48);
END $$;

COMMIT;
