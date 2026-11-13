import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../api/cliente.js';
import { useAuth } from '../context/AuthContext.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

// Pantalla de inicio. Para Administrador e Inventario muestra el panel de alertas de stock (T-49).
export default function Inicio() {
  const { usuario } = useAuth();
  const veAlertas = ['ADMINISTRADOR', 'INVENTARIO'].includes(usuario.rol);

  const [productos, setProductos] = useState(null); // null = cargando
  const [error, setError] = useState('');

  useEffect(() => {
    if (!veAlertas) return;
    pedir('/productos/buscar?nombre=')
      .then(setProductos)
      .catch((err) => setError(err.message));
  }, [veAlertas]);

  // Alerta: controla stock, tiene un mínimo definido y el stock actual llegó a ese mínimo o quedó por debajo.
  const alertas = (productos ?? [])
    .filter((p) => p.controla_stock !== false && Number(p.stock_minimo) > 0 && Number(p.stock_actual) <= Number(p.stock_minimo))
    .sort((a, b) => Number(a.stock_actual) - Number(b.stock_actual));

  const columnas = [
    { clave: 'nombre', titulo: 'Producto' },
    { clave: 'stock_actual', titulo: 'Stock actual', render: (p) => <strong>{p.stock_actual}</strong> },
    { clave: 'stock_minimo', titulo: 'Mínimo' },
    {
      clave: 'estado',
      titulo: 'Estado',
      render: (p) => (Number(p.stock_actual) <= 0 ? 'Sin stock' : 'Stock bajo'),
    },
  ];

  return (
    <>
      <Tarjeta titulo={`¡Hola, ${usuario.nombre}!`}>
        <p>Ingresaste con el rol <strong>{usuario.rol}</strong>.</p>
        <p>Elegí una sección en el menú de la izquierda.</p>
      </Tarjeta>

      {veAlertas && (
        <Tarjeta titulo="Alertas de stock">
          {productos === null && !error && <Estado tipo="cargando" />}
          {error && <Estado tipo="error">{error}</Estado>}
          {productos && alertas.length === 0 && <Mensaje tipo="exito">Todo en orden: ningún producto está por debajo de su mínimo.</Mensaje>}
          {productos && alertas.length > 0 && (
            <>
              <Mensaje tipo="alerta">
                {alertas.length} producto{alertas.length === 1 ? '' : 's'} en el mínimo o por debajo. Conviene reponer.
              </Mensaje>
              <Tabla columnas={columnas} filas={alertas} claveFila="codigo" vacio="" />
              <p className="campo-ayuda">El mínimo de cada producto se define en <Link to="/catalogo">Productos y precios</Link>.</p>
            </>
          )}
        </Tarjeta>
      )}
    </>
  );
}
