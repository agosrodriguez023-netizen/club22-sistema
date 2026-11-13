import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Mensaje from './Mensaje.jsx';

// <RutaProtegida /> sin roles: solo exige estar logueado.
// <RutaProtegida roles={['ADMINISTRADOR']} />: además exige uno de esos roles.
export default function RutaProtegida({ roles }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) {
    return <Mensaje tipo="alerta">No tenés acceso a esta sección.</Mensaje>;
  }
  return <Outlet />;
}
