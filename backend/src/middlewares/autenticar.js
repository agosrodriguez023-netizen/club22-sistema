import jwt from 'jsonwebtoken';

export const autenticar = (req, res, next) => {
    // Buscamos el token en la cabecera (header) de la petición
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ mensaje: 'Acceso denegado: No hay token' });
    }

    // Le sacamos la palabra "Bearer " para quedarnos solo con el código largo
    const token = authHeader.split(' ')[1];

    try {
        // Verificamos si el token es válido y no fue falsificado
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Guardamos los datos del usuario (id, rol) en la petición para usarlos después
        req.usuario = decodificado; 
        next(); // Lo dejamos pasar a la siguiente función
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};