import { pool } from '../config/db.js';

// Las fechas se toman con la hora de Córdoba: una venta de las 23:30 cuenta para ese día.
const DIA = `(v.fecha_hora AT TIME ZONE 'America/Argentina/Cordoba')::date`;

const Reporte = {
  /** Totales del período, por medio de pago y por día. Solo ventas confirmadas. */
  async ventas(desde, hasta) {
    const { rows: [t] } = await pool.query(
      `SELECT COUNT(*)::int AS cantidad_ventas,
              COALESCE(SUM(v.total), 0)::float AS total,
              COALESCE(SUM(v.descuento_total), 0)::float AS descuentos
         FROM venta v
        WHERE v.estado = 'CONFIRMADA' AND ${DIA} BETWEEN $1 AND $2`,
      [desde, hasta]
    );
    const { rows: por_medio } = await pool.query(
      `SELECT mp.nombre AS medio, COUNT(*)::int AS cantidad, SUM(v.total)::float AS total
         FROM venta v JOIN medio_de_pago mp ON mp.id = v.medio_pago_id
        WHERE v.estado = 'CONFIRMADA' AND ${DIA} BETWEEN $1 AND $2
        GROUP BY mp.nombre ORDER BY total DESC`,
      [desde, hasta]
    );
    const { rows: por_dia } = await pool.query(
      `SELECT to_char(${DIA}, 'YYYY-MM-DD') AS fecha, COUNT(*)::int AS cantidad, SUM(v.total)::float AS total
         FROM venta v
        WHERE v.estado = 'CONFIRMADA' AND ${DIA} BETWEEN $1 AND $2
        GROUP BY ${DIA} ORDER BY ${DIA}`,
      [desde, hasta]
    );
    return {
      desde, hasta,
      cantidad_ventas: t.cantidad_ventas,
      total: t.total,
      descuentos: t.descuentos,
      ticket_promedio: t.cantidad_ventas === 0 ? 0 : Math.round((t.total / t.cantidad_ventas) * 100) / 100,
      por_medio,
      por_dia,
    };
  },

  /** Ranking de productos. El importe es el precio de lista (antes de descuentos). */
  async masVendidos(desde, hasta, { limite, orden }) {
    const { rows } = await pool.query(
      `SELECT d.producto_codigo AS codigo, p.nombre, p.categoria,
              SUM(d.cantidad)::int AS unidades, SUM(d.subtotal)::float AS importe
         FROM detalle_venta d
         JOIN venta v ON v.id = d.venta_id
         JOIN productos p ON p.codigo = d.producto_codigo
        WHERE v.estado = 'CONFIRMADA' AND ${DIA} BETWEEN $1 AND $2
        GROUP BY d.producto_codigo, p.nombre, p.categoria
        ORDER BY ${orden === 'importe' ? 'importe' : 'unidades'} DESC, p.nombre
        LIMIT $3`,
      [desde, hasta, limite]
    );
    return rows;
  },

  /** Historial de cierres de caja, del más nuevo al más viejo. */
  async cierres(desde, hasta, { conDiferencia }) {
    const { rows } = await pool.query(
      `SELECT c.id, c.fecha_hora, u.nombre AS cajero, c.fondo_fijo::float AS fondo_fijo,
              c.efectivo_esperado::float AS efectivo_esperado, c.efectivo_contado::float AS efectivo_contado,
              c.diferencia::float AS diferencia, c.total_ventas::float AS total_ventas,
              c.cantidad_ventas, c.observacion,
              COALESCE((SELECT json_agg(json_build_object('medio', mp.nombre, 'total', t.total::float) ORDER BY mp.id)
                          FROM cierre_total_medio t JOIN medio_de_pago mp ON mp.id = t.medio_pago_id
                         WHERE t.cierre_id = c.id), '[]'::json) AS por_medio
         FROM cierre_de_caja c JOIN usuarios u ON u.id = c.usuario_id
        WHERE (c.fecha_hora AT TIME ZONE 'America/Argentina/Cordoba')::date BETWEEN $1 AND $2
          AND ($3::boolean = FALSE OR c.diferencia <> 0)
        ORDER BY c.fecha_hora DESC`,
      [desde, hasta, conDiferencia]
    );
    return rows;
  },

  /** Una fila por venta, para exportar a Excel. */
  async ventasDetalle(desde, hasta) {
    const { rows } = await pool.query(
      `SELECT to_char(v.fecha_hora AT TIME ZONE 'America/Argentina/Cordoba', 'YYYY-MM-DD HH24:MI') AS fecha_hora,
              c.numero AS ticket, v.destino, m.etiqueta AS mesa, mp.nombre AS medio_pago,
              v.subtotal, v.descuento_total, pr.nombre AS promocion, v.descuento_manual_pct,
              v.total, v.origen, u.nombre AS atendido_por
         FROM venta v
         JOIN medio_de_pago mp ON mp.id = v.medio_pago_id
         JOIN usuarios u ON u.id = v.usuario_id
         LEFT JOIN comprobante c ON c.venta_id = v.id
         LEFT JOIN mesa m ON m.id = v.mesa_id
         LEFT JOIN promocion pr ON pr.id = v.promocion_id
        WHERE v.estado = 'CONFIRMADA' AND ${DIA} BETWEEN $1 AND $2
        ORDER BY v.fecha_hora`,
      [desde, hasta]
    );
    return rows;
  },
};

export default Reporte;