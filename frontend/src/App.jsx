import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Layout from './componentes/Layout.jsx';
import RutaProtegida from './componentes/RutaProtegida.jsx';
import Componentes from './paginas/Componentes.jsx';
import Inicio from './paginas/Inicio.jsx';
import Login from './paginas/Login.jsx';
import Pendiente from './paginas/Pendiente.jsx';
import Venta from './paginas/Venta.jsx';
import Usuarios from './paginas/Usuarios.jsx';
import CierreCaja from './paginas/CierreCaja.jsx';

const TODOS = ['ADMINISTRADOR', 'CAJERO', 'SALA', 'INVENTARIO'];
const CAJA = ['ADMINISTRADOR', 'CAJERO'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Todo lo de acá adentro exige estar logueado y muestra el Layout con el menú */}
      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/componentes" element={<Componentes />} />

          <Route element={<RutaProtegida roles={CAJA} />}>
            <Route path="/venta" element={<Venta />} />
            <Route path="/ventas" element={<Pendiente titulo="Mis ventas del día" />} />
            <Route path="/caja/cierre" element={<CierreCaja />} />
          </Route>

          <Route element={<RutaProtegida roles={TODOS} />}>
            <Route path="/catalogo" element={<Pendiente titulo="Productos y precios" />} />
          </Route>

          <Route element={<RutaProtegida roles={['ADMINISTRADOR']} />}>
            <Route path="/admin/usuarios" element={<Usuarios />} />
            <Route path="/admin/auditoria" element={<Pendiente titulo="Registro de acciones" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}
