export const permitir = (...rolesPermitidos) => {
    return (req, res, next) => {
        // Si no hay usuario, o su rol no está en la lista de permitidos, lo rebotamos
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ mensaje: 'No tenés permisos para acceder a esta sección' });
        }
        next(); // Pasa si el rol coincide
    };
};