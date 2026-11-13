// Envía al servidor las ventas guardadas en la cola, sola y sin molestar al cajero.
import { pedir } from '../api/cliente.js';
import { ventasPendientes, quitarDeCola, marcarIntento } from './cola.js';

const CADA_MS = 30000;   // reintento automático cada 30 segundos
let enCurso = false;      // evita enviar dos veces a la vez

/**
 * Intenta enviar todo lo pendiente. Devuelve { enviadas, rechazadas, pendientes }.
 * Si no hay conexión, no hace nada y las ventas siguen en la cola.
 */
export async function sincronizarCola() {
  if (enCurso) return { enviadas: 0, rechazadas: 0, pendientes: null };
  enCurso = true;
  try {
    const items = await ventasPendientes();
    if (items.length === 0) return { enviadas: 0, rechazadas: 0, pendientes: 0 };

    let respuesta;
    try {
      respuesta = await pedir('/ventas/sincronizar', {
        method: 'POST',
        body: { ventas: items.map((i) => i.venta) },
      });
    } catch (e) {
      if (e.sinConexion) return { enviadas: 0, rechazadas: 0, pendientes: items.length };
      throw e;
    }

    let enviadas = 0;
    let rechazadas = 0;
    for (const r of respuesta.resultados) {
      const item = items.find((i) => i.uuid_cliente === r.uuid_cliente);
      if (!item) continue;
      if (r.estado === 'REGISTRADA' || r.estado === 'YA_REGISTRADA') {
        await quitarDeCola(item.uuid_cliente);   // el servidor ya la tiene: sale de la cola
        enviadas++;
      } else {
        await marcarIntento(item, r.error);      // queda en la cola, con el motivo del rechazo
        rechazadas++;
      }
    }
    const pendientes = (await ventasPendientes()).length;
    window.dispatchEvent(new CustomEvent('club22:sync-fin', { detail: { enviadas, rechazadas, pendientes } }));
    return { enviadas, rechazadas, pendientes };
  } finally {
    enCurso = false;
  }
}

/** Arranca la sincronización automática. Devuelve una función para detenerla. */
export function iniciarSincronizacion() {
  sincronizarCola().catch(() => {});                                   // al abrir la app
  const alVolverConexion = () => sincronizarCola().catch(() => {});    // cuando el navegador detecta internet
  window.addEventListener('online', alVolverConexion);
  const reloj = setInterval(alVolverConexion, CADA_MS);                // y cada 30 s por las dudas
  return () => {
    window.removeEventListener('online', alVolverConexion);
    clearInterval(reloj);
  };
}