// Elige la promoción que le corresponde a un producto SIN acumular (RN-01):
// si hay varias vigentes, se aplica una sola, la de mayor porcentaje.
// Ante un empate gana la que es de un producto puntual y después la más antigua.

/** ¿La promoción alcanza a este producto? */
export function alcanza(promo, producto) {
  if (promo.producto_codigo) return promo.producto_codigo === producto.codigo;
  if (promo.categoria) return promo.categoria === producto.categoria;
  return true; // sin producto ni categoría: todo el catálogo
}

export function elegirPromocion(producto, promos) {
  let mejor = null;
  for (const p of promos) {
    if (!alcanza(p, producto)) continue;
    if (mejor === null || esMejor(p, mejor)) mejor = p;
  }
  return mejor;
}

function esMejor(a, b) {
  if (Number(a.porcentaje) !== Number(b.porcentaje)) return Number(a.porcentaje) > Number(b.porcentaje);
  if (Boolean(a.producto_codigo) !== Boolean(b.producto_codigo)) return Boolean(a.producto_codigo);
  return a.id < b.id;
}