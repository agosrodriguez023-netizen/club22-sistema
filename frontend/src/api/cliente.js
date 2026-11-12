// frontend/src/api/cliente.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function pedir(ruta, opciones = {}) {
  const token = localStorage.getItem('token_club22');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opciones.headers,
  };

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers,
  });

  // Si el token expiró o no es válido (Error 401)
  if (respuesta.status === 401) {
    localStorage.removeItem('token_club22');
    localStorage.removeItem('usuario_club22');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor, volvé a ingresar.');
  }

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'Ocurrió un error en la solicitud.');
  }

  return datos;
}