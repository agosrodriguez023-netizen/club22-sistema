import { pool } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

const COLUMNAS = 'id, nombre, cuit, telefono, email, activo';

const Proveedor = {
  async listar({ incluirInactivos = false } = {}) {
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS} FROM proveedor WHERE ($1::boolean OR activo = TRUE) ORDER BY nombre`,
      [incluirInactivos]
    );
    return rows;
  },

  async crear({ nombre, cuit, telefono, email }) {
    await nombreLibre(nombre);
    const { rows } = await pool.query(
      `INSERT INTO proveedor (nombre, cuit, telefono, email) VALUES (TRIM($1), $2, $3, $4) RETURNING ${COLUMNAS}`,
      [nombre, cuit ?? null, telefono ?? null, email ?? null]
    );
    return rows[0];
  },

  /** Solo se cambian los datos que llegan. "activo: false" da de baja al proveedor sin borrar su historial. */
  async editar(id, cambios) {
    const { rows: actual } = await pool.query('SELECT id FROM proveedor WHERE id = $1', [id]);
    if (actual.length === 0) throw httpError(404, 'Proveedor no encontrado');
    if (cambios.nombre !== undefined) await nombreLibre(cambios.nombre, id);

    const sets = [];
    const valores = [];
    for (const campo of ['nombre', 'cuit', 'telefono', 'email', 'activo']) {
      if (cambios[campo] !== undefined) {
        valores.push(campo === 'nombre' ? cambios[campo].trim() : cambios[campo]);
        sets.push(`${campo} = $${valores.length}`);
      }
    }
    if (sets.length === 0) throw httpError(400, 'No hay nada para cambiar');
    valores.push(id);
    const { rows } = await pool.query(
      `UPDATE proveedor SET ${sets.join(', ')} WHERE id = $${valores.length} RETURNING ${COLUMNAS}`,
      valores
    );
    return rows[0];
  },
};

async function nombreLibre(nombre, idActual = 0) {
  const { rows } = await pool.query(
    'SELECT 1 FROM proveedor WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1)) AND id <> $2',
    [nombre, idActual]
  );
  if (rows.length > 0) throw httpError(409, 'Ya existe un proveedor con ese nombre');
}

export default Proveedor;