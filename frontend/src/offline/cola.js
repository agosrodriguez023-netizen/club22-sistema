// Cola de ventas hechas sin conexión. Cada venta espera acá hasta poder enviarse (paso 17).
import { pedir } from '../api/cliente.js';
import { todos, guardar, borrar } from './idb.js';

// Avisa a la pantalla (por ejemplo, al indicador "3 ventas pendientes") que la cola cambió.
function avisarCambio() {
  window.dispatchEvent(new Event('club22:cola-cambio'));
}

/** Ventas esperando enviarse, de la más vieja a la más nueva. */
export async function ventasPendientes() {
  const lista = await todos('cola');
  return lista.sort((a, b) => a.creada.localeCompare(b.creada));
}

export async function cantidadPendientes() {
  return (await todos('cola')).length;
}

/** Guarda una venta en el navegador para enviarla más tarde. */
export async function encolarVenta(venta) {
  await guardar('cola', {
    uuid_cliente: venta.uuid_cliente,   // es la clave: la misma venta nunca queda dos veces
    venta,
    creada: new Date().toISOString(),
    intentos: 0,
  });
  avisarCambio();
}

/** Saca una venta de la cola (cuando el servidor ya la registró). */
export async function quitarDeCola(uuid_cliente) {
  await borrar('cola', uuid_cliente);
  avisarCambio();
}

/** Anota que un envío falló, para mostrarlo y no perderlo de vista. */
export async function marcarIntento(item, motivo) {
  await guardar('cola', { ...item, intentos: item.intentos + 1, ultimo_error: motivo });
  avisarCambio();
}

/**
 * Registra una venta. La pantalla de ventas llama SOLO a esta función.
 *  - Con conexión: la envía al servidor y devuelve { pendiente: false, ticket... }.
 *  - Sin conexión: la guarda en la cola y devuelve { pendiente: true, uuid_cliente }.
 *  - Si el servidor la rechaza (stock, datos inválidos): el error sube a la pantalla y NO se encola.
 */
export async function registrarVenta(datos) {
  // El identificador se crea acá, una sola vez: si se reintenta, el servidor reconoce la venta repetida.
  const venta = { ...datos, uuid_cliente: datos.uuid_cliente ?? crypto.randomUUID() };
  try {
    const respuesta = await pedir('/ventas', { method: 'POST', body: venta });
    return { ...respuesta, pendiente: false };
  } catch (e) {
    if (!e.sinConexion) throw e;
    await encolarVenta(venta);
    return { pendiente: true, uuid_cliente: venta.uuid_cliente };
  }
}