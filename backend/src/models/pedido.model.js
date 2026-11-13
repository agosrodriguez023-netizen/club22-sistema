import { pool, transaccion } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

const Pedido = {
  /** Lista de pedidos, del más nuevo al más viejo. Filtros opcionales: estado y proveedor. */
  async listar({ estado, proveedor_id }) {
    const { rows } = await pool.query(
      `SELECT pe.id, pe.proveedor_id, pr.nombre AS proveedor, pe.estado, pe.fecha_pedido,
              pe.fecha_entrega, pe.numero_remito, pe.observaciones,
              COUNT(d.producto_codigo)::int AS productos,
              COALESCE(SUM(d.cantidad_pedida), 0)::int AS unidades_pedidas,
              SUM(d.cantidad_recibida)::int AS unidades_recibidas
         FROM pedido_proveedor pe
         JOIN proveedor pr ON pr.id = pe.proveedor_id
         LEFT JOIN detalle_pedido d ON d.pedido_id = pe.id
        WHERE ($1::text IS NULL OR pe.estado = $1)
          AND ($2::int  IS NULL OR pe.proveedor_id = $2)
        GROUP BY pe.id, pr.nombre
        ORDER BY pe.fecha_pedido DESC, pe.id DESC`,
      [estado ?? null, proveedor_id ?? null]
    );
    return rows;
  },

  /** Un pedido con sus productos: lo pedido, lo recibido y la diferencia. */
  async obtener(id) {
    const { rows } = await pool.query(
      `SELECT pe.id, pe.proveedor_id, pr.nombre AS proveedor, pe.estado, pe.fecha_pedido,
              pe.fecha_entrega, pe.numero_remito, pe.observaciones, u.nombre AS usuario
         FROM pedido_proveedor pe
         JOIN proveedor pr ON pr.id = pe.proveedor_id
         JOIN usuarios u ON u.id = pe.usuario_id
        WHERE pe.id = $1`,
      [id]
    );
    if (rows.length === 0) return null;
    const { rows: items } = await pool.query(
      `SELECT d.producto_codigo AS codigo, p.nombre, d.cantidad_pedida, d.cantidad_recibida,
              CASE WHEN d.cantidad_recibida IS NULL THEN NULL
                   ELSE d.cantidad_recibida - d.cantidad_pedida END AS diferencia
         FROM detalle_pedido d JOIN productos p ON p.codigo = d.producto_codigo
        WHERE d.pedido_id = $1
        ORDER BY p.nombre`,
      [id]
    );
    return { ...rows[0], items };
  },

  /** Crea un pedido en estado PEDIDO con sus productos. */
  async crear({ proveedor_id, items, observaciones }, usuarioId) {
    return transaccion(async (client) => {
      const { rows: prov } = await client.query('SELECT activo FROM proveedor WHERE id = $1', [proveedor_id]);
      if (prov.length === 0) throw httpError(404, 'Proveedor no encontrado');
      if (!prov[0].activo) throw httpError(400, 'El proveedor está dado de baja');

      const codigos = items.map((i) => i.codigo);
      const { rows: productos } = await client.query(
        'SELECT codigo FROM productos WHERE codigo = ANY($1) AND activo = TRUE',
        [codigos]
      );
      const validos = new Set(productos.map((p) => p.codigo));
      const faltante = codigos.find((c) => !validos.has(c));
      if (faltante) throw httpError(400, `El producto ${faltante} no existe o está dado de baja`);

      const { rows } = await client.query(
        `INSERT INTO pedido_proveedor (proveedor_id, usuario_id, observaciones)
         VALUES ($1, $2, $3) RETURNING id`,
        [proveedor_id, usuarioId, observaciones ?? null]
      );
      for (const i of items) {
        await client.query(
          'INSERT INTO detalle_pedido (pedido_id, producto_codigo, cantidad_pedida) VALUES ($1, $2, $3)',
          [rows[0].id, i.codigo, i.cantidad]
        );
      }
      return rows[0].id;
    });
  },

  /**
   * Ingreso de mercadería con remito. En UNA transacción:
   *  - guarda lo recibido de cada producto (lo que no se menciona cuenta como 0),
   *  - suma el stock y deja un movimiento de INGRESO por producto,
   *  - pasa el pedido a ENTREGADO,
   *  - deja el registro en auditoría.
   * Un pedido solo se puede recibir una vez.
   */
  async registrarIngreso(id, { numero_remito, items }, usuarioId) {
    return transaccion(async (client) => {
      const { rows: pedido } = await client.query(
        'SELECT id, estado FROM pedido_proveedor WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (pedido.length === 0) throw httpError(404, 'Pedido no encontrado');
      if (pedido[0].estado !== 'PEDIDO') {
        throw httpError(409, `El pedido ya está ${pedido[0].estado === 'ENTREGADO' ? 'entregado' : 'cancelado'}`);
      }

      const { rows: detalle } = await client.query(
        `SELECT d.producto_codigo, d.cantidad_pedida, p.controla_stock
           FROM detalle_pedido d JOIN productos p ON p.codigo = d.producto_codigo
          WHERE d.pedido_id = $1`,
        [id]
      );
      const delPedido = new Map(detalle.map((d) => [d.producto_codigo, d]));
      for (const i of items) {
        if (!delPedido.has(i.codigo)) throw httpError(400, `El producto ${i.codigo} no está en este pedido`);
      }
      const recibidas = new Map(items.map((i) => [i.codigo, i.cantidad_recibida]));

      for (const d of detalle) {
        const recibida = recibidas.get(d.producto_codigo) ?? 0;
        await client.query(
          'UPDATE detalle_pedido SET cantidad_recibida = $3 WHERE pedido_id = $1 AND producto_codigo = $2',
          [id, d.producto_codigo, recibida]
        );
        if (recibida > 0 && d.controla_stock) {
          const { rows } = await client.query(
            'UPDATE productos SET stock_actual = stock_actual + $2 WHERE codigo = $1 RETURNING stock_actual',
            [d.producto_codigo, recibida]
          );
          await client.query(
            `INSERT INTO movimiento_stock (producto_codigo, tipo, cantidad, stock_resultante, pedido_id, motivo, usuario_id)
             VALUES ($1, 'INGRESO', $2, $3, $4, $5, $6)`,
            [d.producto_codigo, recibida, rows[0].stock_actual, id, `Remito ${numero_remito}`, usuarioId]
          );
        }
      }

      await client.query(
        `UPDATE pedido_proveedor SET estado = 'ENTREGADO', fecha_entrega = now(), numero_remito = $2 WHERE id = $1`,
        [id, numero_remito]
      );
      await client.query(
        `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, despues)
         VALUES ($1, 'INGRESO_PEDIDO', 'pedido_proveedor', $2, $3)`,
        [usuarioId, id, JSON.stringify({ numero_remito, recibidas: Object.fromEntries(recibidas) })]
      );
    });
  },

  /** Cancela un pedido que todavía no llegó. */
  async cancelar(id) {
    const { rows } = await pool.query(
      `UPDATE pedido_proveedor SET estado = 'CANCELADO' WHERE id = $1 AND estado = 'PEDIDO' RETURNING id`,
      [id]
    );
    if (rows.length === 0) {
      const { rows: existe } = await pool.query('SELECT estado FROM pedido_proveedor WHERE id = $1', [id]);
      if (existe.length === 0) throw httpError(404, 'Pedido no encontrado');
      throw httpError(409, 'Solo se puede cancelar un pedido que todavía no llegó');
    }
  },
};

export default Pedido;