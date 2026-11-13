import { pool, transaccion } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

const SELECT_RESERVAS = `
  SELECT r.id, r.mesa_id, m.etiqueta AS mesa, m.ubicacion,
         to_char(r.fecha, 'YYYY-MM-DD') AS fecha,
         to_char(r.hora_inicio, 'HH24:MI') AS hora_inicio,
         to_char(r.hora_fin, 'HH24:MI') AS hora_fin,
         r.personas, r.nombre_cliente, r.contacto, r.observaciones, r.estado
    FROM reserva r
    JOIN mesa m ON m.id = r.mesa_id`;

// Hay superposición cuando una reserva empieza antes de que termine la otra y termina después de que empieza la otra.
const SUPERPUESTA = `r.estado = 'CONFIRMADA' AND r.fecha = $2 AND r.hora_inicio < $4::time AND r.hora_fin > $3::time`;

const Reserva = {
  /** Reservas de un día (confirmadas, canceladas y cumplidas) para el calendario. */
  async listar(fecha) {
    const { rows } = await pool.query(`${SELECT_RESERVAS} WHERE r.fecha = $1 ORDER BY r.hora_inicio, m.etiqueta`, [fecha]);
    return rows;
  },

  async obtener(id) {
    const { rows } = await pool.query(`${SELECT_RESERVAS} WHERE r.id = $1`, [id]);
    return rows[0] ?? null;
  },

  /** Mesas activas con capacidad suficiente y sin otra reserva confirmada en ese horario. */
  async disponibilidad({ fecha, hora_inicio, hora_fin, personas }) {
    const { rows } = await pool.query(
      `SELECT m.id, m.etiqueta, m.capacidad, m.ubicacion
         FROM mesa m
        WHERE m.activo = TRUE AND m.capacidad >= $1
          AND NOT EXISTS (SELECT 1 FROM reserva r WHERE r.mesa_id = m.id AND ${SUPERPUESTA})
        ORDER BY m.capacidad, m.ubicacion, m.etiqueta`,
      [personas, fecha, hora_inicio, hora_fin]
    );
    return rows;
  },

  /** Revisa capacidad y superposición con la mesa bloqueada, para que dos reservas simultáneas no se pisen. */
  async crear({ mesa_id, fecha, hora_inicio, hora_fin, personas, nombre_cliente, contacto, observaciones }, usuarioId) {
    const id = await transaccion(async (client) => {
      const { rows: mesas } = await client.query(
        'SELECT capacidad FROM mesa WHERE id = $1 AND activo = TRUE FOR UPDATE',
        [mesa_id]
      );
      if (mesas.length === 0) throw httpError(404, 'Mesa no encontrada');
      if (personas > mesas[0].capacidad) {
        throw httpError(409, `La mesa tiene capacidad para ${mesas[0].capacidad} personas`);
      }
      const { rows: pisadas } = await client.query(
        `SELECT to_char(r.hora_inicio, 'HH24:MI') AS desde, to_char(r.hora_fin, 'HH24:MI') AS hasta
           FROM reserva r WHERE r.mesa_id = $1 AND ${SUPERPUESTA}`,
        [mesa_id, fecha, hora_inicio, hora_fin]
      );
      if (pisadas.length > 0) {
        throw httpError(409, `La mesa ya está reservada de ${pisadas[0].desde} a ${pisadas[0].hasta}`);
      }
      const { rows } = await client.query(
        `INSERT INTO reserva (mesa_id, fecha, hora_inicio, hora_fin, personas, nombre_cliente, contacto, observaciones, usuario_id)
         VALUES ($1, $2, $3, $4, $5, TRIM($6), TRIM($7), $8, $9) RETURNING id`,
        [mesa_id, fecha, hora_inicio, hora_fin, personas, nombre_cliente, contacto, observaciones ?? null, usuarioId]
      );
      await marcarReservada(client, mesa_id);
      return rows[0].id;
    });
    return this.obtener(id);
  },

  async cancelar(id) {
    await transaccion(async (client) => {
      const { rows } = await client.query(
        `UPDATE reserva SET estado = 'CANCELADA' WHERE id = $1 AND estado = 'CONFIRMADA' RETURNING mesa_id`,
        [id]
      );
      if (rows.length === 0) {
        const { rows: existe } = await client.query('SELECT 1 FROM reserva WHERE id = $1', [id]);
        if (existe.length === 0) throw httpError(404, 'Reserva no encontrada');
        throw httpError(409, 'Solo se pueden cancelar reservas confirmadas');
      }
      await liberarSiNoQuedanReservas(client, rows[0].mesa_id);
    });
    return this.obtener(id);
  },
};

// La mesa figura RESERVADA solo si hay una reserva confirmada para hoy y está libre.
async function marcarReservada(client, mesaId) {
  await client.query(
    `UPDATE mesa SET estado = 'RESERVADA'
      WHERE id = $1 AND estado = 'LIBRE'
        AND EXISTS (SELECT 1 FROM reserva WHERE mesa_id = $1 AND estado = 'CONFIRMADA' AND fecha = (now() AT TIME ZONE 'America/Argentina/Cordoba')::date)`,
    [mesaId]
  );
}

async function liberarSiNoQuedanReservas(client, mesaId) {
  await client.query(
    `UPDATE mesa SET estado = 'LIBRE'
      WHERE id = $1 AND estado = 'RESERVADA'
        AND NOT EXISTS (SELECT 1 FROM reserva WHERE mesa_id = $1 AND estado = 'CONFIRMADA' AND fecha = (now() AT TIME ZONE 'America/Argentina/Cordoba')::date)`,
    [mesaId]
  );
}

export default Reserva;