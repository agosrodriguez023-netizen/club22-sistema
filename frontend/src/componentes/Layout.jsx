import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import MenuLateral from './MenuLateral.jsx';

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navegar = useNavigate();

  function salir() {
    logout();
    navegar('/login');
  }

  return (
    <div className="layout">
      <header className="layout-cabecera">
        <span className="layout-marca">Club 22</span>
        <div className="layout-usuario">
          <span>{usuario.nombre} · {usuario.rol}</span>
          <button className="boton boton-secundario" onClick={salir}>Salir</button>
        </div>
      </header>
      <MenuLateral />
      <main className="layout-contenido">
        <Outlet />
      </main>
    </div>
  );
}
