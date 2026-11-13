import { useEffect, useRef } from 'react';

// Un lector de códigos de barras "escribe" el código como un teclado muy rápido y termina con Enter.
// Una persona tarda más de 50 ms entre tecla y tecla, el lector no.
const MAX_ENTRE_TECLAS_MS = 50;
const LARGO_MINIMO = 4; // menos que esto no es un código

// Si el lector escribió dentro de un campo de texto, lo vaciamos para que no quede el código escrito ahí.
function vaciarCampo(el) {
  if (el instanceof HTMLInputElement && el.value) {
    const escribir = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    escribir.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * useLectorCodigos((codigo) => { ... })
 * Llama a la función cada vez que se escanea un código. Ejemplo en la pantalla de Venta:
 *   useLectorCodigos((codigo) => agregarPorCodigo(codigo));
 */
export default function useLectorCodigos(alEscanear) {
  // Guardamos siempre la última función recibida, sin volver a registrar el listener.
  const funcion = useRef(alEscanear);
  useEffect(() => {
    funcion.current = alEscanear;
  });

  useEffect(() => {
    let buffer = '';
    let ultima = 0;

    function alPresionar(e) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const ahora = performance.now();
      if (ahora - ultima > MAX_ENTRE_TECLAS_MS) buffer = ''; // pausa larga: empieza de nuevo
      ultima = ahora;

      if (e.key === 'Enter') {
        if (buffer.length >= LARGO_MINIMO) {
          e.preventDefault();
          vaciarCampo(e.target);
          funcion.current(buffer);
        }
        buffer = '';
        return;
      }
      if (e.key.length === 1) buffer += e.key; // solo caracteres, no Shift, Tab, etc.
    }

    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, []);
}