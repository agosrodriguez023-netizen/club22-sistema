// frontend/src/componentes/Campo.jsx
import React from 'react';

export default function Campo({ label, type = 'text', value, onChange, error, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
      {label && <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--gris-600)' }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          padding: '10px',
          borderRadius: 'var(--radio-borde)',
          border: `1px solid ${error ? 'var(--error)' : 'var(--gris-200)'}`,
          outline: 'none',
          fontSize: '14px',
          backgroundColor: 'var(--blanco)'
        }}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--error)' }}>{error}</span>}
    </div>
  );
}