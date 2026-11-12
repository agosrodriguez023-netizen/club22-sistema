// frontend/src/componentes/MenuLateral.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function MenuLateral() {
  const { usuario, logout } = useAuth();
  const rol = usuario?.rol || 'invitado';

  return (
    <aside style={{ width: '250px', background: 'var(--blanco)', borderRight: '1px solid var(--gris-200)', display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}>
      <h2 style={{ color: 'var(--bordo)', fontSize: '20px', marginBottom: '24px' }}>Club 22</h2>
      
      <div style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--gris-600)' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{usuario?.nombre || 'Usuario'}</p>
        <p style={{ margin: 0, textTransform: 'capitalize', fontSize: '12px' }}>Rol: {rol}</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {/* Opciones para Ventas y Caja */}
        {(rol === 'administrador' || rol === 'cajero' || rol === 'mozo') && (
          <a href="/ventas" style={{ padding: '10px', color: 'var(--gris-900)', textDecoration: 'none', borderRadius: 'var(--radio-borde)' }}>Ventas / Caja</a>
        )}

        {/* Opciones exclusivas de Administrador */}
        {rol === 'administrador' && (
          <>
            <a href="/productos" style={{ padding: '10px', color: 'var(--gris-900)', textDecoration: 'none', borderRadius: 'var(--radio-borde)' }}>Catálogo y Precios</a>
            <a href="/usuarios" style={{ padding: '10px', color: 'var(--gris-900)', textDecoration: 'none', borderRadius: 'var(--radio-borde)' }}>Gestión de Usuarios</a>
            <a href="/reportes" style={{ padding: '10px', color: 'var(--gris-900)', textDecoration: 'none', borderRadius: 'var(--radio-borde)' }}>Reportes</a>
          </>
        )}
      </nav>

      <button onClick={logout} style={{ padding: '10px', background: 'var(--gris-100)', border: 'none', borderRadius: 'var(--radio-borde)', cursor: 'pointer', color: 'var(--error)', fontWeight: 'bold' }}>
        Cerrar Sesión
      </button>
    </aside>
  );
}