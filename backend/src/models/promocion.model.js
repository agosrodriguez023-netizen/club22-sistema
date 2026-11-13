import { pool } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

const ZONA = 'America/Argentina/Cordoba';

const SELECT_PROMOS = `
  SELECT p.id, p.nombre, p.tipo, p.porcentaje::float AS porcentaje, p.categoria, p.producto_codigo,
         to_char(p.fecha_desde, 'YYYY-MM-DD') AS fecha_desde,
         to_char(p.fecha_hasta, 'YYYY-MM-DD') AS fecha_hasta,
         p.dias_semana,
         to_char(p.hora_desde, 'HH24:MI') AS hora_desde,
         to_char(p.hora_hasta, 'HH24:MI') AS hora_hasta,
         p.activo
    FROM promocion p`;

const Promocion = {
  async listar() {
    const { rows } = await pool.query(`${SELECT_PROMOS} ORDER BY p.activo DESC, p.fecha_hasta DESC, p.nombre`);
    return rows;
  },

  async obtener(id) {
    const { rows } = await pool.query(`${SELECT_PROMOS} WHERE p.id = $1`, [id]);
    return rows[0] ?? null;
  },

  /**
   * Promociones que valen en un momento dado (RN-04): activas, dentro de las fechas,
   * en un día de la semana permitido y dentro del horario. Se calcula con la hora de Córdoba.
   * `cuando` es la fecha y hora de la venta (una venta hecha sin conexión usa la hora en que se hizo).
   */
  async vigentes(cuando = new Date(), db = pool) {
    const { rows } = await db.query(
      `${SELECT_PROMOS},
         LATERAL (SELECT ($1::timestamptz AT TIME ZONE '${ZONA}') AS local) t
        WHERE p.activo = TRUE
          AND t.local::date BETWEEN p.fecha_desde AND p.fecha_hasta
          AND EXTRACT(DOW FROM t.local)::int = ANY(p.dias_semana)
          AND (p.hora_desde IS NULL OR (t.local::time >= p.hora_desde AND t.local::time < p.hora_hasta))
        ORDER BY p.id`,
      [cuando]
    );
    return rows;
  },

  async crear(c, usuarioId) {
    await verificarProducto(c.producto_codigo);
    const { rows } = await pool.query(
      `INSERT INTO promocion (nombre, tipo, porcentaje, categoria, producto_codigo, fecha_desde, fecha_hasta,
                              dias_semana, hora_desde, hora_hasta, activo, creado_por)
       VALUES (TRIM($1), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [c.nombre, c.tipo, c.porcentaje, c.categoria ?? null, c.producto_codigo ?? null, c.fecha_desde, c.fecha_hasta,
       c.dias_semana, c.hora_desde ?? null, c.hora_hasta ?? null, c.activo ?? true, usuarioId]
    );
    return this.obtener(rows[0].id);
  },

  /** `c` es la promoción completa (ya combinada con los cambios y validada). */
  async editar(id, c) {
    await verificarProducto(c.producto_codigo);
    const { rowCount } = await pool.query(
      `UPDATE promocion SET nombre = TRIM($2), tipo = $3, porcentaje = $4, categoria = $5, producto_codigo = $6,
              fecha_desde = $7, fecha_hasta = $8, dias_semana = $9, hora_desde = $10, hora_hasta = $11, activo = $12
        WHERE id = $1`,
      [id, c.nombre, c.tipo, c.porcentaje, c.categoria ?? null, c.producto_codigo ?? null, c.fecha_desde, c.fecha_hasta,
       c.dias_semana, c.hora_desde ?? null, c.hora_hasta ?? null, c.activo]
    );
    if (rowCount === 0) throw httpError(404, 'Promoción no encontrada');
    return this.obtener(id);
  },
};

async function verificarProducto(codigo) {
  if (!codigo) return;
  const { rows } = await pool.query('SELECT 1 FROM productos WHERE codigo = $1', [codigo]);
  if (rows.length === 0) throw httpError(400, 'El producto de la promoción no existe');
}

export default Promocion;