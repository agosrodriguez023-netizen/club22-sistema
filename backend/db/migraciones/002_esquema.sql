BEGIN;

-- La clave de unión con productos es `codigo`: tiene que ser única.
-- (Si ya es la clave primaria, este paso no cambia nada importante.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'productos'::regclass AND contype IN ('p', 'u')
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'productos'::regclass AND attname = 'codigo')]
  ) THEN
    ALTER TABLE productos ADD CONSTRAINT productos_codigo_unico UNIQUE (codigo);
  END IF;
END $$;

-- Stock mínimo para las alertas del incremento 2
ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock_minimo INTEGER NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- Catálogo (RF-05, RF-07)
-- ---------------------------------------------------------------------
CREATE TABLE medio_de_pago (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(40) NOT NULL UNIQUE,
  es_efectivo BOOLEAN NOT NULL DEFAULT FALSE,             -- el cierre compara solo el efectivo contado
  activo  BOOLEAN     NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- Mesas y reservas (RF-10, RF-11, RN-03)
-- ---------------------------------------------------------------------
CREATE TABLE mesa (
  id             SERIAL PRIMARY KEY,
  etiqueta       VARCHAR(30)  NOT NULL UNIQUE,            -- "Ventana 2", "Vereda 1"
  capacidad      SMALLINT     NOT NULL CHECK (capacidad > 0),
  ubicacion      VARCHAR(30)  NOT NULL,                   -- Salón, Vereda, Patio, Barra alta
  observaciones  VARCHAR(200),
  estado         VARCHAR(10)  NOT NULL DEFAULT 'LIBRE'
                 CHECK (estado IN ('LIBRE','OCUPADA','RESERVADA')),
  ocupada_desde  TIMESTAMPTZ,                             -- para calcular el consumo acumulado
  activo         BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE reserva (
  id              SERIAL PRIMARY KEY,
  mesa_id         INTEGER      NOT NULL REFERENCES mesa(id),
  fecha           DATE         NOT NULL,
  hora_inicio     TIME         NOT NULL,
  hora_fin        TIME         NOT NULL,
  personas        SMALLINT     NOT NULL CHECK (personas > 0),
  nombre_cliente  VARCHAR(80)  NOT NULL,
  contacto        VARCHAR(40)  NOT NULL,                  -- dato personal (Ley 25.326): solo para gestionar la reserva
  observaciones   VARCHAR(200),
  estado          VARCHAR(12)  NOT NULL DEFAULT 'CONFIRMADA'
                  CHECK (estado IN ('CONFIRMADA','CANCELADA','CUMPLIDA')),
  usuario_id      INTEGER      NOT NULL REFERENCES usuarios(id),
  creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (hora_fin > hora_inicio)
);
CREATE INDEX idx_reserva_fecha ON reserva (fecha, mesa_id);
-- La superposición (RN-03) se controla en la API dentro de una transacción.

-- ---------------------------------------------------------------------
-- Promociones (RF-12, RN-01, RN-04)
-- ---------------------------------------------------------------------
CREATE TABLE promocion (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL,
  tipo          VARCHAR(12)  NOT NULL CHECK (tipo IN ('PORCENTAJE','HAPPY_HOUR')),
  porcentaje    NUMERIC(5,2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
  categoria     VARCHAR(40),                              -- NULL = aplica a todo el catálogo
  producto_codigo VARCHAR(50) REFERENCES productos(codigo),   -- opcional: promo de un producto puntual
  fecha_desde   DATE         NOT NULL,
  fecha_hasta   DATE         NOT NULL,
  dias_semana   SMALLINT[]   NOT NULL DEFAULT '{0,1,2,3,4,5,6}', -- 0 = domingo
  hora_desde    TIME,                                     -- NULL = todo el día
  hora_hasta    TIME,
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_por    INTEGER      NOT NULL REFERENCES usuarios(id),
  CHECK (fecha_hasta >= fecha_desde)
);

-- ---------------------------------------------------------------------
-- Cierre de caja (RF-04, RN-02) — se declara antes de venta porque venta lo referencia
-- ---------------------------------------------------------------------
CREATE TABLE cierre_de_caja (
  id                 SERIAL PRIMARY KEY,
  fecha_hora         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  usuario_id         INTEGER       NOT NULL REFERENCES usuarios(id),
  fondo_fijo         NUMERIC(12,2) NOT NULL CHECK (fondo_fijo >= 0),
  efectivo_esperado  NUMERIC(12,2) NOT NULL,              -- fondo fijo + ventas en efectivo
  efectivo_contado   NUMERIC(12,2) NOT NULL CHECK (efectivo_contado >= 0),
  diferencia         NUMERIC(12,2) NOT NULL,              -- contado - esperado
  total_ventas       NUMERIC(12,2) NOT NULL,
  cantidad_ventas    INTEGER       NOT NULL,
  observacion        VARCHAR(300),
  CHECK (diferencia = 0 OR observacion IS NOT NULL)
);

CREATE TABLE cierre_total_medio (                         -- foto de los totales por medio de pago
  cierre_id      INTEGER       NOT NULL REFERENCES cierre_de_caja(id),
  medio_pago_id  INTEGER       NOT NULL REFERENCES medio_de_pago(id),
  total          NUMERIC(12,2) NOT NULL,
  PRIMARY KEY (cierre_id, medio_pago_id)
);

-- ---------------------------------------------------------------------
-- Ventas (RF-01, RF-02, RF-03)
-- ---------------------------------------------------------------------
CREATE TABLE venta (
  id                    SERIAL PRIMARY KEY,
  uuid_cliente          UUID          NOT NULL UNIQUE,    -- lo genera el navegador: evita duplicados al sincronizar
  fecha_hora            TIMESTAMPTZ   NOT NULL,           -- momento real de la venta (aunque se sincronice después)
  usuario_id            INTEGER       NOT NULL REFERENCES usuarios(id),
  destino               VARCHAR(6)    NOT NULL CHECK (destino IN ('LLEVAR','MESA')),
  mesa_id               INTEGER       REFERENCES mesa(id),
  subtotal              NUMERIC(12,2) NOT NULL,
  descuento_manual_pct  NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (descuento_manual_pct BETWEEN 0 AND 100),
  promocion_id          INTEGER       REFERENCES promocion(id),
  descuento_total       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total                 NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  medio_pago_id         INTEGER       NOT NULL REFERENCES medio_de_pago(id),
  monto_recibido        NUMERIC(12,2),                    -- solo efectivo
  vuelto                NUMERIC(12,2),
  origen                VARCHAR(8)    NOT NULL DEFAULT 'ONLINE' CHECK (origen IN ('ONLINE','OFFLINE')),
  estado                VARCHAR(10)   NOT NULL DEFAULT 'CONFIRMADA' CHECK (estado IN ('CONFIRMADA','ANULADA')),
  cierre_id             INTEGER       REFERENCES cierre_de_caja(id), -- NULL = todavía no cerrada
  CHECK ((destino = 'MESA') = (mesa_id IS NOT NULL)),
  -- RN-01: o descuento manual o promoción, nunca los dos
  CHECK (NOT (descuento_manual_pct > 0 AND promocion_id IS NOT NULL))
);
CREATE INDEX idx_venta_fecha  ON venta (fecha_hora);
CREATE INDEX idx_venta_cierre ON venta (cierre_id);

CREATE TABLE detalle_venta (
  id               SERIAL PRIMARY KEY,
  venta_id         INTEGER       NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
  producto_codigo  VARCHAR(50)   NOT NULL REFERENCES productos(codigo),
  cantidad         INTEGER       NOT NULL CHECK (cantidad > 0),
  precio_unitario  NUMERIC(12,2) NOT NULL,                -- precio congelado al momento de vender
  subtotal         NUMERIC(12,2) NOT NULL
);

CREATE TABLE comprobante (                                -- ticket NO fiscal
  id          SERIAL PRIMARY KEY,
  venta_id    INTEGER     NOT NULL UNIQUE REFERENCES venta(id),
  numero      SERIAL      NOT NULL UNIQUE,                -- correlativo
  emitido_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  leyenda     VARCHAR(60) NOT NULL DEFAULT 'Comprobante no válido como factura'
);

-- ---------------------------------------------------------------------
-- Proveedores y pedidos (RF-08, RF-09)
-- ---------------------------------------------------------------------
CREATE TABLE proveedor (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  cuit      VARCHAR(13),
  telefono  VARCHAR(30),
  email     VARCHAR(100),
  activo    BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE pedido_proveedor (
  id             SERIAL PRIMARY KEY,
  proveedor_id   INTEGER     NOT NULL REFERENCES proveedor(id),
  estado         VARCHAR(10) NOT NULL DEFAULT 'PEDIDO' CHECK (estado IN ('PEDIDO','ENTREGADO','CANCELADO')),
  fecha_pedido   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_entrega  TIMESTAMPTZ,
  numero_remito  VARCHAR(30),
  usuario_id     INTEGER     NOT NULL REFERENCES usuarios(id),
  observaciones  VARCHAR(200)
);

CREATE TABLE detalle_pedido (
  pedido_id          INTEGER NOT NULL REFERENCES pedido_proveedor(id) ON DELETE CASCADE,
  producto_codigo    VARCHAR(50) NOT NULL REFERENCES productos(codigo),
  cantidad_pedida    INTEGER NOT NULL CHECK (cantidad_pedida > 0),
  cantidad_recibida  INTEGER CHECK (cantidad_recibida >= 0),
  PRIMARY KEY (pedido_id, producto_codigo)
);

-- ---------------------------------------------------------------------
-- Movimientos de stock (RF-06)
-- ---------------------------------------------------------------------
CREATE TABLE movimiento_stock (
  id                SERIAL PRIMARY KEY,
  producto_codigo   VARCHAR(50) NOT NULL REFERENCES productos(codigo),
  tipo              VARCHAR(8)  NOT NULL CHECK (tipo IN ('VENTA','INGRESO','AJUSTE','INICIAL')),
  cantidad          INTEGER     NOT NULL,                 -- negativa = sale, positiva = entra
  stock_resultante  INTEGER     NOT NULL,
  venta_id          INTEGER     REFERENCES venta(id),
  pedido_id         INTEGER     REFERENCES pedido_proveedor(id),
  motivo            VARCHAR(200),                         -- obligatorio en ajustes (lo valida la API)
  usuario_id        INTEGER     NOT NULL REFERENCES usuarios(id),
  fecha_hora        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mov_producto ON movimiento_stock (producto_codigo, fecha_hora);


COMMIT;

