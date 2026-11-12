import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { buscarUsuarioPorNombre } from '../models/usuario.model.js';

export const comprobarSalud = async (req, res) => {
    try {
        await pool.query('SELECT 1'); // Prueba simple a la base de datos
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Error en la base de datos' });
    }
};

export const login = async (req, res) => {
    try {
        const { nombre, password } = req.body ?? {};
        if (!nombre || !password) {
            return res.status(400).json({ mensaje: 'Ingresá usuario y contraseña' });
        }

        const usuario = await buscarUsuarioPorNombre(nombre);
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const coincide = await bcrypt.compare(password, usuario.password);
        if (!coincide) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

export const yo = (req, res) => {
    // Como pasó por el middleware 'autenticar', req.usuario ya tiene los datos desencriptados
    res.json({ 
        mensaje: 'Estás autenticada correctamente', 
        usuario: req.usuario 
    });
};
