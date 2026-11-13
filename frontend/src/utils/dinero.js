// En la base los precios son pesos enteros. Esto solo los muestra como $ 12.345
export function dinero(pesos) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(pesos);
}

