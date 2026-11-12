// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { pedir } from '../api/cliente';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState({
    id: 1,
    nombre: 'Admin',
    rol: 'ADMINISTRADOR'
  });
  const login = async (nombre, password) => {
    // Hace la petición POST al endpoint de login del backend
    const respuesta = await pedir('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nombre, password }),
    });

    localStorage.setItem('token_club22', respuesta.token);
    localStorage.setItem('usuario_club22', JSON.stringify(respuesta.usuario));
    setUsuario(respuesta.usuario);
    return respuesta.usuario;
  };

  const logout = () => {
    localStorage.removeItem('token_club22');
    localStorage.removeItem('usuario_club22');
    setUsuario(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);