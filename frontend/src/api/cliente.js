// Único lugar del frontend que habla con la API. El resto de la app usa pedir().
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const CLAVE_TOKEN = 'club22_token';
const CLAVE_USUARIO = 'club22_usuario';

export const sesion = {
  token: () => localStorage.getItem(CLAVE_TOKEN),
  usuario: () => {
    try { return JSON.parse(localStorage.getItem(CLAVE_USUARIO)); } catch { return null; }
  },
  guardar(token, usuario) {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  },
  borrar() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  },
};

/**
 * pedir('/ventas', { method: 'POST', body: {...} })
 * - agrega el token
 * - convierte la respuesta a JSON
 * - si la API responde 401 con una sesión abierta, la cierra
 * - si hay error, lanza un Error con el mensaje que mandó el backend
 */
export async function pedir(ruta, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = sesion.token();
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    const e = new Error('No hay conexión con el servidor');
    e.sinConexion = true;
    throw e;
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      sesion.borrar();
      window.dispatchEvent(new Event('club22:sesion-vencida'));
    }
    const e = new Error(datos?.mensaje || 'Ocurrió un error');
    e.status = respuesta.status;
    throw e;
  }
  return datos;
}
