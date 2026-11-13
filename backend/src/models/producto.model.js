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
        `SELECT codigo, nombre, categoria, precio_mostrador, precio_mesa, stock_actual, stock_minimo, controla_stock
        FROM productos WHERE codigo = $1 AND activo = TRUE`,
        [codigo]
    );
        return rows[0] ?? null;
    },

    crear: async (producto) => {
        const { codigo, nombre, categoria, precio_mostrador, precio_mesa, stock_minimo } = producto;
        const res = await pool.query(
            `INSERT INTO productos (codigo, nombre, categoria, precio_mostrador, precio_mesa, stock_minimo)
             VALUES ($1, $2, $3, $4, $5, COALESCE($6, 0)) RETURNING *`,
            [codigo, nombre, categoria, precio_mostrador, precio_mesa, stock_minimo]
        );
        return res.rows[0];
    },

    editar: async (codigo, producto) => {
        const { nombre, categoria, stock_minimo } = producto;
        // COALESCE: si no llega stock_minimo, se deja el que ya tenía
        const result = await pool.query(
            `UPDATE productos
             SET nombre = $1, categoria = $2, stock_minimo = COALESCE($3, stock_minimo)
             WHERE codigo = $4 RETURNING *`,
            [nombre, categoria, stock_minimo, codigo]
        );
        return result.rows[0];
    },

    bajaLogica: async (codigo) => {
        const result = await pool.query(
            'UPDATE productos SET activo = false WHERE codigo = $1 RETURNING *',
            [codigo]
        );
        return result.rows[0];
    },

    actualizarPrecio: async (codigo, precioMostrador, precioMesa, usuario_id) => {
        return await transaccion(async (cliente) => {
            const resAnterior = await cliente.query(
                'SELECT codigo, nombre, precio_mostrador, precio_mesa FROM productos WHERE codigo = $1',
                [codigo]
            );
            if (resAnterior.rows.length === 0) return undefined;

            const resNuevo = await cliente.query(
                'UPDATE productos SET precio_mostrador = $1, precio_mesa = $2 WHERE codigo = $3 RETURNING codigo, nombre, precio_mostrador, precio_mesa',
                [precioMostrador, precioMesa, codigo]
            );

            // Queda registrado quién cambió el precio, con el antes y el después
            await cliente.query(
                `INSERT INTO auditoria (usuario_id, accion, entidad, antes, despues)
                 VALUES ($1, 'CAMBIO_PRECIO', 'productos', $2, $3)`,
                [usuario_id, JSON.stringify(resAnterior.rows[0]), JSON.stringify(resNuevo.rows[0])]
            );

            return resNuevo.rows[0];
        });
    }
};