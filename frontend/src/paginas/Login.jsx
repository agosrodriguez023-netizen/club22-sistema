import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

export default function Login() {
  const { usuario, login } = useAuth();
  const navegar = useNavigate();
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ingresando, setIngresando] = useState(false);

  if (usuario) return <Navigate to="/inicio" replace />;

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (!nombre.trim() || !password) {
      setError('Completá el usuario y la contraseña.');
      return;
    }
    setIngresando(true);
    try {
      await login(nombre.trim(), password);
      navegar('/inicio');
    } catch (err) {
      setError(err.sinConexion ? err.message : 'Usuario o contraseña incorrectos.');
    } finally {
      setIngresando(false);
    }
  }

  return (
    <div className="login">
      <Tarjeta titulo="Club 22 · Ingresar">
        <form onSubmit={enviar} noValidate>
          {error && <Mensaje tipo="error">{error}</Mensaje>}
          <Campo etiqueta="Usuario" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="username" autoFocus />
          <Campo etiqueta="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <Boton type="submit" cargando={ingresando} textoCargando="Ingresando…">Ingresar</Boton>
        </form>
      </Tarjeta>
    </div>
  );
}
