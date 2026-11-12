// frontend/src/componentes/Boton.jsx
import React from 'react';
import '../estilos/tokens.css';

export default function Boton({ children, onClick, tipo = 'button', variante = 'primaria', disabled = false }) {
  const estiloBase = {
    padding: '10px 16px',
    borderRadius: 'var(--radio-borde)',
    fontWeight: 'var(--peso-medio)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'background-color 0.2s',
  };

  const estilosVariante = {
    primaria: { backgroundColor: 'var(--bordo)', color: 'var(--blanco)' },
    secundaria: { backgroundColor: 'var(--gris-200)', color: 'var(--gris-900)' },
    peligro: { backgroundColor: 'var(--error)', color: 'var(--blanco)' }
  };

  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      style={{ ...estiloBase, ...estilosVariante[variante], opacity: disabled ? 0.6 : 1 }}
    >
      {children}
    </button>
  );
}