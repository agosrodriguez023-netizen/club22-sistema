// frontend/src/paginas/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Boton from '../componentes/Boton';
import Campo from '../componentes/Campo';

export default function Login() {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();

  const manejarSubmit = async (e) => {
    e.preventDefault();
    console.log("¡Hice click! Nombre:", nombre, "Password:", password); // <-- Agregá esto
    setError('');
    setCargando(true);

    try {
      await login(nombre, password);
      window.location.href = '/'; // Te lleva al inicio tras loguearte
    } catch (err) {
        console.error("Error en login:", err);
      setError(err.message || 'Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--gris-50)' }}>
      <form onSubmit={manejarSubmit} style={{ background: 'var(--blanco)', padding: '32px', borderRadius: 'var(--radio-borde)', boxShadow: 'var(--sombra-tarjeta)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: 'var(--bordo)', marginBottom: '24px', textAlign: 'center' }}>Club 22 · Ingreso</h2>
        
        <Campo 
          label="Usuario" 
          value={nombre} 
          onChange={(e) => setNombre(e.target.value)} 
          placeholder="Ej: admin"
        />

        <Campo 
          label="Contraseña" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="********"
        />

        {error && <p style={{ color: 'var(--error)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

        <Boton type="submit" disabled={cargando} variante="primaria">
          {cargando ? 'Ingresando…' : 'Iniciar Sesión'}
        </Boton>
      </form>
    </div>
  );
}