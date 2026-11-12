// frontend/src/componentes/Tarjeta.jsx
import React from 'react';

export default function Tarjeta({ children, titulo }) {
  return (
    <div style={{
      background: 'var(--blanco)',
      borderRadius: 'var(--radio-borde)',
      boxShadow: 'var(--sombra-tarjeta)',
      padding: '20px',
      marginBottom: '16px',
      border: '1px solid var(--gris-200)'
    }}>
      {titulo && <h3 style={{ marginTop: 0, marginBottom: '12px', color: 'var(--bordo)', fontSize: '18px' }}>{titulo}</h3>}
      {children}
    </div>
  );
}