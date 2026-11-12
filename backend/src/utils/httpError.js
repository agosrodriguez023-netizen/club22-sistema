// Crea un error con código HTTP. El middleware de errores usa err.status.
export function httpError(status, mensaje) {
  return Object.assign(new Error(mensaje), { status });
}