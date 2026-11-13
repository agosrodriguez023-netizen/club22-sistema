// Catálogo guardado en el navegador: permite buscar productos y vender sin internet.
import { pedir } from '../api/cliente.js';
import { obtener, todos, guardar, reemplazarTodo } from './idb.js';

/** Baja el catálogo del servidor y lo guarda localmente. Devuelve cuántos productos quedaron. */
export async function actualizarCatalogo() {
  const productos = await pedir('/catalogo');
  await reemplazarTodo('catalogo', productos);
  await guardar('meta', { clave: 'catalogo_actualizado', valor: new Date().toISOString() });
  return productos.length;
}

/** Fecha de la última descarga (o null si nunca se bajó). */
export async function ultimaActualizacion() {
  const m = await obtener('meta', 'catalogo_actualizado');
  return m ? m.valor : null;
}

/** Busca por código exacto, sin ir al servidor. Devuelve el producto o undefined. */
export async function buscarPorCodigoLocal(codigo) {
  return obtener('catalogo', String(codigo).trim());
}

/** Busca por parte del nombre (sin importar mayúsculas ni tildes). */
export async function buscarPorNombreLocal(texto) {
  const limpiar = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const buscado = limpiar(texto.trim());
  if (!buscado) return [];
  return (await todos('catalogo')).filter((p) => limpiar(p.nombre).includes(buscado));
}

/**
 * Para el lector y el buscador de la pantalla de ventas:
 * intenta primero con el servidor (datos al día) y, si no hay conexión, usa el catálogo local.
 */
export async function buscarProducto(codigo) {
  try {
    return await pedir(`/productos/${encodeURIComponent(codigo)}`);
  } catch (e) {
    if (e.sinConexion) return (await buscarPorCodigoLocal(codigo)) ?? null;
    if (e.status === 404) return null;
    throw e;
  }
}
