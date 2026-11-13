import { pool } from '../config/db.js';

const MedioPago = {
  /** Medios de pago activos, en el orden en que se cargaron (Efectivo primero). */
  async listar() {
    const { rows } = await pool.query(
      'SELECT id, nombre, es_efectivo FROM medio_de_pago WHERE activo = TRUE ORDER BY id'
    );
    return rows;
  },
};

export default MedioPago;