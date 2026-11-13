// Muestra pesos como $ 12.345 (y con centavos solo si los hay: $ 12.345,50).
export function dinero(pesos) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(pesos);
}

// Para calcular se trabaja en CENTAVOS (enteros), igual que el servidor: evita errores de decimales.
export const aCentavos = (pesos) => Math.round(Number(pesos) * 100);
export const aPesos = (centavos) => centavos / 100;

