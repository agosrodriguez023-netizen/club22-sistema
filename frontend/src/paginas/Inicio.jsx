import { useAuth } from '../context/AuthContext.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

// Pantalla de bienvenida (paso 5 del día 1). Después cada rol irá directo a su pantalla de inicio.
export default function Inicio() {
  const { usuario } = useAuth();
  return (
    <Tarjeta titulo={`¡Hola, ${usuario.nombre}!`}>
      <p>Ingresaste con el rol <strong>{usuario.rol}</strong>.</p>
      <p>Elegí una sección en el menú de la izquierda.</p>
    </Tarjeta>
  );
}
