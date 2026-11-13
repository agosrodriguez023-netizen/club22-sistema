import { pool, transaccion } from '../config/db.js';
import { httpError } from '../utils/httpError.js';
import { elegirPromocion } from '../utils/promociones.js';
import Promocion from './promocion.model.js';

// Los importes se calculan en CENTAVOS (enteros) para evitar errores de decimales.
const aCentavos = (pesos) => Math.round(Number(pesos) * 100);
const aPesos = (centavos) => (centavos / 100).toFixed(2);

const Venta = {
  /**
   * Registra una venta completa en UNA transacción:
   * venta + detalle + descuento de stock + movimientos + ticket.
   * Si algo falla, no se guarda nada.
   *
   * datos: { uuid_cliente, fecha_hora?, destino, mesa_id?, items:[{codigo, cantidad}],
   *          medio_pago_id, descuento_pct?, monto_recibido? }
   */
  async registrar(datos, usuarioId) {
    return transaccion(async (client) => {
      // 1) Traer de la base los productos reales (no confiamos en los precios del navegador)
      const codigos = datos.items.map((i) => i.codigo);
      const { rows: productos } = await client.query(
        `SELECT codigo, nombre, categoria, precio_mostrador, precio_mesa, controla_stock
           FROM productos WHERE codigo = ANY($1) AND activo = TRUE`,
        [codigos]
      );
      const porCodigo = new Map(productos.map((p) => [p.codigo, p]));

      // 2) Armar las líneas con el precio que corresponde al destino
      const lineas = datos.items.map((item) => {
        const p = porCodigo.get(item.codigo);
        if (!p) throw httpError(400, `El producto ${item.codigo} no existe o está dado de baja`);
        const precio = datos.destino === 'MESA' ? p.precio_mesa : p.precio_mostrador;
        // Sin precio (vacío o 0) = ese producto no se vende en ese destino
        if (precio === null || Number(precio) <= 0) {
          const donde = datos.destino === 'MESA' ? 'en mesa' : 'para llevar';
          throw httpError(400, `"${p.nombre}" no se vende ${donde}`);
        }
        const precioC = aCentavos(precio);
        return { p, cantidad: item.cantidad, precioC, subtotalC: precioC * item.cantidad };
      });

      // 3) Subtotal, descuento y total.
      //    RN-01: promoción y descuento manual no se suman. Si el cajero carga un descuento manual,
      //    no se aplican promociones. Si no, cada producto recibe UNA sola promoción (la mejor vigente).
      const subtotalC = lineas.reduce((acc, l) => acc + l.subtotalC, 0);
      const descuentoPct = datos.descuento_pct ?? 0;
      let descuentoC = Math.round((subtotalC * descuentoPct) / 100);
      let promocionId = null;
      if (descuentoPct === 0) {
        // RN-04: se miran las promociones vigentes en el momento de la venta (si fue sin conexión, cuando se hizo)
        const vigentes = await Promocion.vigentes(datos.fecha_hora ?? new Date(), client);
        const porPromo = new Map(); // id de promoción -> centavos que descontó
        descuentoC = 0;
        for (const l of lineas) {
          const promo = elegirPromocion(l.p, vigentes);
          if (!promo) continue;
          const d = Math.round((l.subtotalC * Number(promo.porcentaje)) / 100);
          descuentoC += d;
          porPromo.set(promo.id, (porPromo.get(promo.id) ?? 0) + d);
        }
        // La venta guarda una sola promoción: la que más descontó
        promocionId = [...porPromo].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      }
      const totalC = subtotalC - descuentoC;

      // 4) Medio de pago y vuelto (solo en efectivo)
      const { rows: medios } = await client.query(
        'SELECT id, es_efectivo FROM medio_de_pago WHERE id = $1 AND activo = TRUE',
        [datos.medio_pago_id]
      );
      if (medios.length === 0) throw httpError(400, 'Medio de pago inválido');

      let recibidoC = null;
      let vueltoC = null;
      if (medios[0].es_efectivo) {
        if (datos.monto_recibido === undefined || datos.monto_recibido === null) {
          throw httpError(400, 'Falta el monto recibido en efectivo');
        }
        recibidoC = aCentavos(datos.monto_recibido);
        if (recibidoC < totalC) throw httpError(400, 'El monto recibido no alcanza para cubrir el total');
        vueltoC = recibidoC - totalC;
      }

      // 5) Guardar la venta. Si el uuid_cliente ya existe, es una venta repetida
      //    (por ejemplo, reenviada al volver internet): no se guarda de nuevo.
      const { rows: nueva } = await client.query(
        `INSERT INTO venta (uuid_cliente, fecha_hora, usuario_id, destino, mesa_id, subtotal,
                            descuento_manual_pct, promocion_id, descuento_total, total, medio_pago_id,
                            monto_recibido, vuelto, origen)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (uuid_cliente) DO NOTHING
         RETURNING id`,
        [
          datos.uuid_cliente,
          datos.fecha_hora ?? new Date(),
          usuarioId,
          datos.destino,
          datos.destino === 'MESA' ? datos.mesa_id : null,
          aPesos(subtotalC),
          descuentoPct,
          promocionId,
          aPesos(descuentoC),
          aPesos(totalC),
          datos.medio_pago_id,
          recibidoC === null ? null : aPesos(recibidoC),
          vueltoC === null ? null : aPesos(vueltoC),
          datos.origen === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
        ]
      );
      if (nueva.length === 0) {
        const { rows } = await client.query('SELECT id FROM venta WHERE uuid_cliente = $1', [datos.uuid_cliente]);
        return { id: rows[0].id, yaRegistrada: true };
      }
      const ventaId = nueva[0].id;

      // 6) Detalle de la venta, descuento de stock y movimiento de stock
      for (const l of lineas) {
        await client.query(
          `INSERT INTO detalle_venta (venta_id, producto_codigo, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [ventaId, l.p.codigo, l.cantidad, aPesos(l.precioC), aPesos(l.subtotalC)]
        );

        if (l.p.controla_stock) {
          // El UPDATE resta y devuelve el stock resultante en un solo paso (sin carreras entre ventas).
          const { rows } = await client.query(
            `UPDATE productos SET stock_actual = stock_actual - $1
              WHERE codigo = $2 RETURNING stock_actual`,
            [l.cantidad, l.p.codigo]
          );
          await client.query(
            `INSERT INTO movimiento_stock (producto_codigo, tipo, cantidad, stock_resultante, venta_id, usuario_id)
             VALUES ($1, 'VENTA', $2, $3, $4, $5)`,
            [l.p.codigo, -l.cantidad, rows[0].stock_actual, ventaId, usuarioId]
          );
        }
      }

      // 7) Ticket (comprobante no fiscal) con número correlativo
      await client.query('INSERT INTO comprobante (venta_id) VALUES ($1)', [ventaId]);

      return { id: ventaId, yaRegistrada: false };
    });
  },

    /** Ventas entre dos momentos (ISO). Si se pasa usuarioId, solo las de ese usuario. */
  async listar({ desde, hasta, usuarioId }) {
    const { rows } = await pool.query(
      `SELECT v.id, v.fecha_hora, v.destino, v.total, v.estado,
              c.numero AS numero_ticket, mp.nombre AS medio_pago, u.nombre AS atendido_por
         FROM venta v
         JOIN comprobante c    ON c.venta_id = v.id
         JOIN medio_de_pago mp ON mp.id = v.medio_pago_id
         JOIN usuarios u       ON u.id = v.usuario_id
        WHERE v.fecha_hora >= $1 AND v.fecha_hora < $2
          AND ($3::int IS NULL OR v.usuario_id = $3)
        ORDER BY v.fecha_hora DESC, v.id DESC`,
      [desde, hasta, usuarioId ?? null]
    );
    return rows;
  },


  /** Devuelve la venta lista para mostrar el ticket. */
  async obtener(id) {
    const { rows } = await pool.query(
      `SELECT v.id, v.uuid_cliente, v.fecha_hora, v.destino, v.subtotal, v.descuento_manual_pct,
              v.descuento_total, v.total, v.monto_recibido, v.vuelto, v.origen, v.estado,
              c.numero AS numero_ticket, c.leyenda, pr.nombre AS promocion,
              mp.nombre AS medio_pago, u.nombre AS atendido_por, m.etiqueta AS mesa
         FROM venta v
         JOIN comprobante c    ON c.venta_id = v.id
         JOIN medio_de_pago mp ON mp.id = v.medio_pago_id
         JOIN usuarios u       ON u.id = v.usuario_id
         LEFT JOIN mesa m      ON m.id = v.mesa_id
         LEFT JOIN promocion pr ON pr.id = v.promocion_id
         WHERE v.id = $1`,
      [id]
    );
    if (rows.length === 0) return null;
    const { rows: items } = await pool.query(
      `SELECT d.producto_codigo AS codigo, p.nombre, d.cantidad, d.precio_unitario, d.subtotal
         FROM detalle_venta d JOIN productos p ON p.codigo = d.producto_codigo
        WHERE d.venta_id = $1 ORDER BY d.id`,
      [id]
    );
    return { ...rows[0], items };
  },
};

export default Venta;