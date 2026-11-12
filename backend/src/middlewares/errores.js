// Middleware global de errores: tiene que tener 4 parámetros (err, req, res, next).
export function errores(err, req, res, next) {
  console.error(err); // muestra el error real en la terminal del servidor
  const status = err.status || 500;
  const mensaje = status === 500 ? 'Error interno del servidor' : err.message;
  res.status(status).json({ mensaje });
}