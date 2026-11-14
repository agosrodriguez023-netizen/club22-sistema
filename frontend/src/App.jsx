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
import Auditoria from './paginas/Auditoria.jsx';
import CierreCaja from './paginas/CierreCaja.jsx';
import Catalogo from './paginas/Catalogo.jsx';
import MisVentas from './paginas/MisVentas.jsx';
import Pendientes from './paginas/Pendientes.jsx';
import Proveedores from './paginas/Proveedores.jsx';
import Pedidos from './paginas/Pedidos.jsx';
import Stock from './paginas/Stock.jsx';

const TODOS = ['ADMINISTRADOR', 'CAJERO', 'SALA', 'INVENTARIO'];
const CAJA = ['ADMINISTRADOR', 'CAJERO'];
const STOCK = ['ADMINISTRADOR', 'INVENTARIO'];

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
            <Route path="/ventas" element={<MisVentas />} />
            <Route path="/caja/cierre" element={<CierreCaja />} />
            <Route path="/pendientes" element={<Pendientes />} />
          </Route>

          <Route element={<RutaProtegida roles={TODOS} />}>
            <Route path="/catalogo" element={<Catalogo />} />
          </Route>

          <Route element={<RutaProtegida roles={STOCK} />}>
            <Route path="/stock" element={<Stock />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/pedidos" element={<Pedidos />} />
          </Route>

          <Route element={<RutaProtegida roles={['ADMINISTRADOR']} />}>
            <Route path="/admin/usuarios" element={<Usuarios />} />
            <Route path="/admin/auditoria" element={<Auditoria />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}