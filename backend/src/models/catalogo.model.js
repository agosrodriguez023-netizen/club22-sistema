import { pool } from '../config/db.js';

const Catalogo = {
  /** Todos los productos activos, con lo justo para vender sin conexión. */
  async listar() {
    const { rows } = await pool.query(
      `SELECT codigo, nombre, categoria, precio_mostrador, precio_mesa,
              stock_actual, controla_stock
         FROM productos
        WHERE activo = TRUE
        ORDER BY nombre`
    );
    return rows;
  },
};

export default Catalogo;