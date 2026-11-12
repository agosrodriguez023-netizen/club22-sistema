import pool from '../config/db.js';

export const buscarUsuarioPorNombre = async (nombre) => {
    // Buscamos el usuario por nombre y verificamos que esté activo
    const result = await pool.query('SELECT * FROM usuarios WHERE nombre = $1 AND activo = true', [nombre]);
    return result.rows[0];
};