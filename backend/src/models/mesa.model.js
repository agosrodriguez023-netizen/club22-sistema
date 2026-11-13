import { pool, transaccion } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

// El consumo de una mesa ocupada es la suma de las ventas confirmadas de esa mesa desde que se ocupó.
// Si la mesa no está ocupada, el consumo es 0.
const SELECT_MESAS = `
  SELECT m.id, m.etiqueta, m.capacidad, m.ubicacion, m.observaciones, m.estado, m.ocupada_desde, m.activo,
         CASE WHEN m.estado = 'OCUPADA' THEN COALESCE(c.consumo, 0) ELSE 0 END AS consumo,
         CASE WHEN m.estado = 'OCUPADA' THEN COALESCE(c.ventas, 0) ELSE 0 END AS cantidad_ventas
    FROM mesa m
    LEFT JOIN LATERAL (
      SELECT SUM(v.total) AS consumo, COUNT(*)::int AS ventas
        FROM venta v
       WHERE v.mesa_id = m.id AND v.estado = 'CONFIRMADA' AND v.fecha_hora >= m.ocupada_desde
    ) c ON TRUE`;

const Mesa = {
  /** Todas las mesas activas con su estado y consumo. */
  async listar() {
    const { rows } = await pool.query(`${SELECT_MESAS} WHERE m.activo = TRUE ORDER BY m.ubicacion, m.etiqueta`);
    return rows;
  },

  /** Una mesa con las ventas que componen su consumo actual. */
  async obtener(id) {
    const { rows } = await pool.query(`${SELECT_MESAS} WHERE m.id = $1`, [id]);
    if (rows.length === 0) return null;
    const { rows: ventas } = await pool.query(
      `SELECT v.id, v.fecha_hora, v.total, c.numero AS numero_ticket
         FROM venta v LEFT JOIN comprobante c ON c.venta_id = v.id
        WHERE v.mesa_id = $1 AND v.estado = 'CONFIRMADA' AND $2::timestamptz IS NOT NULL AND v.fecha_hora >= $2
        ORDER BY v.fecha_hora`,
      [id, rows[0].estado === 'OCUPADA' ? rows[0].ocupada_desde : null]
    );
    return { ...rows[0], ventas };
  },

  async crear({ etiqueta, capacidad, ubicacion, observaciones }) {
    await etiquetaLibre(etiqueta);
    const { rows } = await pool.query(
      `INSERT INTO mesa (etiqueta, capacidad, ubicacion, observaciones) VALUES (TRIM($1), $2, TRIM($3), $4) RETURNING id`,
      [etiqueta, capacidad, ubicacion, observaciones ?? null]
    );
    return this.obtener(rows[0].id);
  },

  /** Solo se cambian los datos que llegan. */
  async editar(id, cambios) {
    const { rows: actual } = await pool.query('SELECT id FROM mesa WHERE id = $1 AND activo = TRUE', [id]);
    if (actual.length === 0) throw httpError(404, 'Mesa no encontrada');
    if (cambios.etiqueta !== undefined) await etiquetaLibre(cambios.etiqueta, id);

    const sets = [];
    const valores = [];
    for (const campo of ['etiqueta', 'capacidad', 'ubicacion', 'observaciones']) {
      if (cambios[campo] !== undefined) {
        const v = cambios[campo];
        valores.push(typeof v === 'string' ? v.trim() : v);
        sets.push(`${campo} = $${valores.length}`);
      }
    }
    if (sets.length === 0) throw httpError(400, 'No hay nada para cambiar');
    valores.push(id);
    await pool.query(`UPDATE mesa SET ${sets.join(', ')} WHERE id = $${valores.length}`, valores);
    return this.obtener(id);
  },

  /** Baja lógica. Una mesa ocupada no se da de baja; si tiene reservas futuras hay que confirmarlo. */
  async darDeBaja(id, { confirmar }) {
    return transaccion(async (client) => {
      const { rows } = await client.query('SELECT estado FROM mesa WHERE id = $1 AND activo = TRUE FOR UPDATE', [id]);
      if (rows.length === 0) throw httpError(404, 'Mesa no encontrada');
      if (rows[0].estado === 'OCUPADA') throw httpError(409, 'La mesa está ocupada: liberala antes de darla de baja');
      const { rows: res } = await client.query(
        `SELECT COUNT(*)::int AS n FROM reserva
          WHERE mesa_id = $1 AND estado = 'CONFIRMADA' AND fecha >= CURRENT_DATE`,
        [id]
      );
      if (res[0].n > 0 && !confirmar) {
        throw httpError(409, `La mesa tiene ${res[0].n} reserva(s) futura(s). Si querés darla de baja igual, confirmalo.`);
      }
      await client.query(`UPDATE mesa SET activo = FALSE, estado = 'LIBRE', ocupada_desde = NULL WHERE id = $1`, [id]);
    });
  },

  /** LIBRE o RESERVADA (el cliente llegó) -> OCUPADA. Desde acá se acumula el consumo. */
  async ocupar(id) {
    const { rows } = await pool.query(
      `UPDATE mesa SET estado = 'OCUPADA', ocupada_desde = now()
        WHERE id = $1 AND activo = TRUE AND estado <> 'OCUPADA' RETURNING id`,
      [id]
    );
    if (rows.length === 0) await explicarFallo(id, 'La mesa ya está ocupada');
    return this.obtener(id);
  },

  /** OCUPADA -> LIBRE y el consumo vuelve a cero. */
  async liberar(id) {
    const { rows } = await pool.query(
      `UPDATE mesa SET estado = 'LIBRE', ocupada_desde = NULL
        WHERE id = $1 AND activo = TRUE AND estado = 'OCUPADA' RETURNING id`,
      [id]
    );
    if (rows.length === 0) await explicarFallo(id, 'La mesa no está ocupada');
    return this.obtener(id);
  },
};

async function explicarFallo(id, mensajeConflicto) {
  const { rows } = await pool.query('SELECT 1 FROM mesa WHERE id = $1 AND activo = TRUE', [id]);
  if (rows.length === 0) throw httpError(404, 'Mesa no encontrada');
  throw httpError(409, mensajeConflicto);
}

async function etiquetaLibre(etiqueta, idActual = 0) {
  const { rows } = await pool.query('SELECT 1 FROM mesa WHERE LOWER(TRIM(etiqueta)) = LOWER(TRIM($1)) AND id <> $2', [etiqueta, idActual]);
  if (rows.length > 0) throw httpError(409, 'Ya existe una mesa con esa etiqueta');
}

export default Mesa;