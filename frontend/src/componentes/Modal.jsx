import { useEffect, useRef } from 'react';

// Usa el <dialog> nativo del navegador: se cierra con Esc y el foco queda dentro de la ventana.
export default function Modal({ abierto, titulo, onCerrar, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog ref={ref} className="modal" aria-labelledby="modal-titulo" onClose={onCerrar}>
      <h2 id="modal-titulo">{titulo}</h2>
      {children}
    </dialog>
  );
}
