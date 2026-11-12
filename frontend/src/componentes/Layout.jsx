// frontend/src/componentes/Layout.jsx
import React from 'react';
import MenuLateral from './MenuLateral';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <MenuLateral />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: 'var(--gris-50)' }}>
        {children}
      </main>
    </div>
  );
}