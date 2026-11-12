import pool from '../config/db.js';

export const buscarUsuarioPorNombre = async (nombre) => {
    const result = await pool.query(
        'SELECT * FROM usuarios WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1)) AND activo = true',
        [nombre]
    );
    return result.rows[0];
};