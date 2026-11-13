import { createContext, useContext, useEffect, useState } from 'react';
import { pedir, sesion } from '../api/cliente.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => (sesion.token() ? sesion.usuario() : null));

  // Si la API dice 401 (token vencido), el cliente avisa y cerramos la sesión acá.
  useEffect(() => {
    const cerrar = () => setUsuario(null);
    window.addEventListener('club22:sesion-vencida', cerrar);
    return () => window.removeEventListener('club22:sesion-vencida', cerrar);
  }, []);

  async function login(nombre, password) {
    const datos = await pedir('/auth/login', { method: 'POST', body: { nombre, password } });
    // El backend puede devolver { token, usuario: {...} } o { token, id, nombre, rol }.
    const u = datos.usuario ?? { id: datos.id, nombre: datos.nombre, rol: datos.rol };
    sesion.guardar(datos.token, u);
    setUsuario(u);
    return u;
  }

  function logout() {
    sesion.borrar();
    setUsuario(null);
  }

  return <AuthContext.Provider value={{ usuario, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
