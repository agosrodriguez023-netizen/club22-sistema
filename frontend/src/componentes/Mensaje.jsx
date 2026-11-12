// frontend/src/componentes/Mensaje.jsx
import React from 'react';

export default function Mensaje({ texto, tipo = 'exito' }) {
  const colores = {
    exito: { fondo: '#ECFDF5', texto: '#065F46', borde: '#A7F3D0' },
    error: { fondo: '#FEF2F2', texto: '#991B1B', borde: '#FECACA' },
    alerta: { fondo: '#FFFBEB', texto: '#92400E', borde: '#FDE68A' }
  };

  const estiloActual = colores[tipo] || colores.exito;

  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: estiloActual.fondo,
      color: estiloActual.texto,
      border: `1px solid ${estiloActual.borde}`,
      borderRadius: 'var(--radio-borde)',
      fontSize: '14px',
      marginBottom: '16px'
    }}>
      {texto}
    </div>
  );
}