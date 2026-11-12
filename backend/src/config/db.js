// backend/src/config/db.js
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// Función centralizada para manejar transacciones seguras
export const transaccion = async (fn) => {
    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');
        const resultado = await fn(cliente);
        await cliente.query('COMMIT');
        return resultado;
    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error; // Lanza el error para que lo ataje el controlador
    } finally {
        cliente.release();
    }
};

export default pool;