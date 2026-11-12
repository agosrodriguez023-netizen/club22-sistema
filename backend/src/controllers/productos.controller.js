import { Producto } from '../models/producto.model.js';

export const buscarPorNombre = async (req, res) => {
    try {
        const productos = await Producto.buscarPorNombre(req.query.nombre);
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const buscarPorCodigo = async (req, res) => {
    try {
        const producto = await Producto.buscarPorCodigo(req.params.codigo);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crear = async (req, res) => {
    try {
        const nuevo = await Producto.crear(req.body);
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const editar = async (req, res) => {
    try {
        const actualizado = await Producto.editar(req.params.id, req.body);
        res.json(actualizado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const actualizarPrecio = async (req, res) => {
    try {
        const { codigo } = req.params; // Usamos codigo en vez de id
        const { precio_mostrador, precio_mesa, usuario_id } = req.body;
        
        const productoActualizado = await Producto.actualizarPrecio(codigo, precio_mostrador, precio_mesa, usuario_id);
        res.json(productoActualizado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const bajaLogica = async (req, res) => {
    try {
        await Producto.bajaLogica(req.params.id);
        res.json({ mensaje: 'Producto dado de baja exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};