// frontend/src/componentes/Modal.jsx
import React from 'react';
import Boton from './Boton';

export default function Modal({ isOpen, onClose, titulo, children }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--blanco)', padding: '24px', borderRadius: 'var(--radio-borde)',
        width: '100%', maxWidth: '500px', boxShadow: 'var(--sombra-tarjeta)', position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--bordo)' }}>{titulo}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--gris-600)' }}>✕</button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}