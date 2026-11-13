import { pool, transaccion } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

// Un producto está "en alerta" cuando tiene un mínimo cargado (mayor a 0) y el stock llegó a ese mínimo o está por debajo.
const ALERTA = 'p.controla_stock AND p.stock_minimo > 0 AND p.stock_actual <= p.stock_minimo';

const Stock = {
  /** Productos que controlan stock, con el aviso de alerta. Si soloAlertas es true, solo los que están en alerta. */
  async listar({ soloAlertas = false } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM (
         SELECT p.codigo, p.nombre, p.categoria, p.stock_actual, p.stock_minimo,
                (${ALERTA}) AS alerta
           FROM productos p
          WHERE p.activo = TRUE AND p.controla_stock = TRUE
       ) s
        WHERE ($1::boolean = FALSE OR s.alerta)
        ORDER BY s.alerta DESC, s.nombre`,
      [soloAlertas]
    );
    return rows;
  },

  /** Historial de un producto, del más nuevo al más viejo. */
  async movimientos(codigo, limite) {
    const { rows: prod } = await pool.query('SELECT codigo, nombre, stock_actual FROM productos WHERE codigo = $1', [codigo]);
    if (prod.length === 0) throw httpError(404, 'Producto no encontrado');
    const { rows } = await pool.query(
      `SELECT m.id, m.fecha_hora, m.tipo, m.cantidad, m.stock_resultante, m.motivo,
              m.venta_id, m.pedido_id, u.nombre AS usuario
         FROM movimiento_stock m JOIN usuarios u ON u.id = m.usuario_id
        WHERE m.producto_codigo = $1
        ORDER BY m.fecha_hora DESC, m.id DESC
        LIMIT $2`,
      [codigo, limite]
    );
    return { producto: prod[0], movimientos: rows };
  },

  /** Cambia el stock mínimo de un producto y lo deja en la auditoría. */
  async cambiarMinimo(codigo, minimo, usuarioId) {
    return transaccion(async (client) => {
      const { rows: antes } = await client.query(
        'SELECT codigo, nombre, stock_actual, stock_minimo FROM productos WHERE codigo = $1 FOR UPDATE',
        [codigo]
      );
      if (antes.length === 0) throw httpError(404, 'Producto no encontrado');
      const { rows } = await client.query(
        `UPDATE productos p SET stock_minimo = $2 WHERE p.codigo = $1
         RETURNING p.codigo, p.nombre, p.stock_actual, p.stock_minimo, (${ALERTA}) AS alerta`,
        [codigo, minimo]
      );
      await client.query(
        `INSERT INTO auditoria (usuario_id, accion, entidad, antes, despues)
         VALUES ($1, 'CAMBIO_STOCK_MINIMO', 'productos', $2, $3)`,
        [usuarioId, JSON.stringify(antes[0]), JSON.stringify(rows[0])]
      );
      return rows[0];
    });
  },

  /** Ajuste manual: deja el stock en un valor nuevo, con motivo obligatorio, movimiento y auditoría. */
  async ajustar(codigo, { stock_nuevo, motivo }, usuarioId) {
    return transaccion(async (client) => {
      const r = await ajustarEn(client, codigo, stock_nuevo, motivo, usuarioId);
      if (r.diferencia === 0) throw httpError(400, 'El stock ya tiene ese valor, no hay nada para ajustar');
      return r;
    });
  },

  /**
   * Conteo físico: compara lo contado con lo que dice el sistema.
   * Si aplicar es true, corrige las diferencias (cada una queda como ajuste con el motivo).
   * Devuelve el porcentaje de coincidencia.
   */
  async conteo(items, { aplicar, motivo }, usuarioId) {
    return transaccion(async (client) => {
      const detalle = [];
      for (const { codigo, contado } of items) {
        const r = aplicar
          ? await ajustarEn(client, codigo, contado, `Conteo físico: ${motivo}`, usuarioId)
          : await compararEn(client, codigo, contado);
        detalle.push(r);
      }
      const coinciden = detalle.filter((d) => d.diferencia === 0).length;
      return {
        aplicado: aplicar,
        total: detalle.length,
        coinciden,
        porcentaje_coincidencia: Math.round((coinciden / detalle.length) * 1000) / 10,
        items: detalle,
      };
    });
  },
};

// Lee y bloquea el producto para que nadie venda a la vez que se cuenta.
async function leerParaStock(client, codigo) {
  const { rows } = await client.query(
    'SELECT codigo, nombre, stock_actual, stock_minimo, controla_stock FROM productos WHERE codigo = $1 FOR UPDATE',
    [codigo]
  );
  if (rows.length === 0) throw httpError(404, `El producto ${codigo} no existe`);
  if (!rows[0].controla_stock) throw httpError(400, `"${rows[0].nombre}" no controla stock`);
  return rows[0];
}

async function compararEn(client, codigo, contado) {
  const p = await leerParaStock(client, codigo);
  return { codigo, nombre: p.nombre, sistema: p.stock_actual, contado, diferencia: contado - p.stock_actual };
}

async function ajustarEn(client, codigo, stockNuevo, motivo, usuarioId) {
  const p = await leerParaStock(client, codigo);
  const diferencia = stockNuevo - p.stock_actual;
  if (diferencia === 0) {
    return { codigo, nombre: p.nombre, sistema: p.stock_actual, contado: stockNuevo, stock_anterior: p.stock_actual, stock_actual: p.stock_actual, diferencia: 0 };
  }
  await client.query('UPDATE productos SET stock_actual = $2 WHERE codigo = $1', [codigo, stockNuevo]);
  await client.query(
    `INSERT INTO movimiento_stock (producto_codigo, tipo, cantidad, stock_resultante, motivo, usuario_id)
     VALUES ($1, 'AJUSTE', $2, $3, $4, $5)`,
    [codigo, diferencia, stockNuevo, motivo, usuarioId]
  );
  await client.query(
    `INSERT INTO auditoria (usuario_id, accion, entidad, antes, despues)
     VALUES ($1, 'AJUSTE_STOCK', 'productos', $2, $3)`,
    [
      usuarioId,
      JSON.stringify({ codigo, stock: p.stock_actual }),
      JSON.stringify({ codigo, stock: stockNuevo, motivo }),
    ]
  );
  return {
    codigo,
    nombre: p.nombre,
    sistema: p.stock_actual,
    contado: stockNuevo,
    stock_anterior: p.stock_actual,
    stock_actual: stockNuevo,
    diferencia,
    alerta: p.stock_minimo > 0 && stockNuevo <= p.stock_minimo,
  };
}

export default Stock;