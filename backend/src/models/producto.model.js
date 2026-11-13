import pool, { transaccion } from '../config/db.js';

export const Producto = {
    buscarPorNombre: async (nombre) => {
        const result = await pool.query(
            'SELECT * FROM productos WHERE nombre ILIKE $1 AND activo = true',
            [`%${nombre}%`]
        );
        return result.rows;
    },

    async buscarPorCodigo(codigo) {
    const { rows } = await pool.query(
        `SELECT codigo, nombre, categoria, precio_mostrador, precio_mesa, stock_actual, controla_stock
        FROM productos WHERE codigo = $1 AND activo = TRUE`,
        [codigo]
    );
        return rows[0] ?? null;
    },

    crear: async (producto) => {
        const { codigo, nombre, categoria, precio_mostrador, precio_mesa } = producto;
        const res = await pool.query(
            'INSERT INTO productos (codigo, nombre, categoria, precio_mostrador, precio_mesa) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [codigo, nombre, categoria, precio_mostrador, precio_mesa]
        );
        return res.rows[0];
    },

    editar: async (id, producto) => {
        const { nombre, categoria } = producto;
        const result = await pool.query(
            'UPDATE productos SET nombre = $1, categoria = $2 WHERE id = $3 RETURNING *',
            [nombre, categoria, id]
        );
        return result.rows[0];
    },

    bajaLogica: async (id) => {
        const result = await pool.query(
            'UPDATE productos SET activo = false WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    },

actualizarPrecio: async (codigo, precioMostrador, precioMesa, usuario_id) => {
        return await transaccion(async (cliente) => {
            const resAnterior = await cliente.query('SELECT nombre, precio_mostrador, precio_mesa FROM productos WHERE codigo = $1', [codigo]);
            const { nombre, precio_mostrador: prevMostrador, precio_mesa: prevMesa } = resAnterior.rows[0];
            
            const resNuevo = await cliente.query(
                'UPDATE productos SET precio_mostrador = $1, precio_mesa = $2 WHERE codigo = $3 RETURNING *',
                [precioMostrador, precioMesa, codigo]
            );
            
            await cliente.query(
                `INSERT INTO auditoria (accion, detalle, usuario_id) VALUES ($1, $2, $3)`,
                ['CAMBIO_PRECIO', `Producto: ${nombre} | Mostrador: $${prevMostrador}->$${precioMostrador} | Mesa: $${prevMesa}->$${precioMesa}`, usuario_id || null]
            );
            
            return resNuevo.rows[0];
        });
    }
};