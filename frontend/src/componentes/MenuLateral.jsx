import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Mapa de pantallas por rol (sección 4 del plan). Se van sumando filas a medida que se construyen pantallas.
export const SECCIONES = [
  { ruta: '/inicio', texto: 'Inicio', roles: ['ADMINISTRADOR', 'CAJERO', 'SALA', 'INVENTARIO'] },
  { ruta: '/venta', texto: 'Venta', roles: ['ADMINISTRADOR', 'CAJERO'] },
  { ruta: '/ventas', texto: 'Mis ventas del día', roles: ['ADMINISTRADOR', 'CAJERO'] },
  { ruta: '/pendientes', texto: 'Ventas pendientes', roles: ['ADMINISTRADOR', 'CAJERO'] },
  { ruta: '/caja/cierre', texto: 'Cierre de caja', roles: ['ADMINISTRADOR', 'CAJERO'] },
  { ruta: '/catalogo', texto: 'Productos y precios', roles: ['ADMINISTRADOR', 'CAJERO', 'SALA', 'INVENTARIO'] },
  { ruta: '/stock', texto: 'Stock', roles: ['ADMINISTRADOR', 'INVENTARIO'] },
  { ruta: '/proveedores', texto: 'Proveedores', roles: ['ADMINISTRADOR', 'INVENTARIO'] },
  { ruta: '/pedidos', texto: 'Pedidos', roles: ['ADMINISTRADOR', 'INVENTARIO'] },
  { ruta: '/mesas', texto: 'Mesas', roles: ['ADMINISTRADOR', 'SALA'] },
  { ruta: '/reservas', texto: 'Reservas', roles: ['ADMINISTRADOR', 'SALA'] },
  { ruta: '/admin/usuarios', texto: 'Usuarios', roles: ['ADMINISTRADOR'] },
  { ruta: '/admin/auditoria', texto: 'Registro de acciones', roles: ['ADMINISTRADOR'] },
  { ruta: '/componentes', texto: 'Componentes', roles: ['ADMINISTRADOR', 'CAJERO', 'SALA', 'INVENTARIO'] },
];

export default function MenuLateral() {
  const { usuario } = useAuth();
  const visibles = SECCIONES.filter((s) => s.roles.includes(usuario.rol));
  return (
    <nav className="menu" aria-label="Menú principal">
      {visibles.map((s) => (
        <NavLink key={s.ruta} to={s.ruta} className={({ isActive }) => (isActive ? 'activo' : undefined)}>
          {s.texto}
        </NavLink>
      ))}
    </nav>
  );
}