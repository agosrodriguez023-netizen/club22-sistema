import { pool } from '../config/db.js';

const Auditoria = {
  async listar({ accion, usuario_id, desde, hasta, limite }) {
    const { rows } = await pool.query(
      `SELECT a.id, a.fecha_hora, a.accion, a.entidad, a.entidad_id, a.antes, a.despues,
              u.nombre AS usuario
         FROM auditoria a JOIN usuarios u ON u.id = a.usuario_id
        WHERE ($1::text IS NULL OR a.accion = $1)
          AND ($2::int  IS NULL OR a.usuario_id = $2)
          AND ($3::date IS NULL OR a.fecha_hora >= $3::date)
          AND ($4::date IS NULL OR a.fecha_hora <  $4::date + 1)
        ORDER BY a.fecha_hora DESC, a.id DESC
        LIMIT $5`,
      [accion ?? null, usuario_id ?? null, desde ?? null, hasta ?? null, limite]
    );
    return rows;
  },
};

export default Auditoria;