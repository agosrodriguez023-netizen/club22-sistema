import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import { dinero } from '../utils/dinero.js';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const hoy = () => new Date().toLocaleDateString('en-CA');
const primeroDelMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA');
};

// Nombres legibles para las columnas que puede devolver la API.
const TITULOS = {
  fecha: 'Fecha', dia: 'Día', cantidad: 'Cantidad', cantidad_ventas: 'Ventas', ventas: 'Ventas', tickets: 'Tickets',
  total: 'Total', importe: 'Importe', subtotal: 'Subtotal', descuento: 'Descuento', descuento_total: 'Descuento',
  medio_pago: 'Medio de pago', medio: 'Medio de pago', codigo: 'Código', nombre: 'Producto', producto: 'Producto',
  unidades: 'Unidades', usuario: 'Usuario', cajero: 'Cajero', fondo_inicial: 'Fondo inicial', esperado: 'Esperado',
  contado: 'Contado', diferencia: 'Diferencia', observacion: 'Observación', fecha_hora: 'Fecha y hora', efectivo: 'Efectivo',
};
const ES_DINERO = new Set(['total', 'importe', 'subtotal', 'descuento', 'descuento_total', 'fondo_inicial', 'esperado', 'contado', 'diferencia', 'efectivo']);

const titulo = (clave) => TITULOS[clave] ?? clave.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

function formatear(clave, valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (ES_DINERO.has(clave) && Number.isFinite(Number(valor))) return dinero(Number(valor));
  if (/fecha|hora/.test(clave) && typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
    return valor.length > 10 ? new Date(valor).toLocaleString('es-AR') : valor;
  }
  if (typeof valor === 'object') return JSON.stringify(valor);
  return String(valor);
}

// Arma la tabla sola a partir de las columnas que devuelve la API.
function TablaDatos({ filas }) {
  if (!Array.isArray(filas) || filas.length === 0) return <p>No hay datos en este período.</p>;
  const claves = Object.keys(filas[0]);
  const columnas = claves.map((k) => ({ clave: k, titulo: titulo(k), render: (f) => formatear(k, f[k]) }));
  return <Tabla columnas={columnas} filas={filas.map((f, i) => ({ ...f, _fila: i }))} claveFila="_fila" vacio="No hay datos en este período." />;
}

// Reportes de ventas, productos más vendidos y cierres de caja (HU-25 y HU-26). Solo Administrador.
export default function Reportes() {
  const [desde, setDesde] = useState(primeroDelMes());
  const [hasta, setHasta] = useState(hoy());
  const [vista, setVista] = useState('ventas'); // ventas | mas-vendidos | cierres
  const [orden, setOrden] = useState('unidades');
  const [soloDiferencias, setSoloDiferencias] = useState(false);
  const [datos, setDatos] = useState(null); // null = cargando
  const [error, setError] = useState('');

  async function cargar() {
    setDatos(null);
    setError('');
    if (!desde || !hasta) return setError('Elegí las dos fechas.');
    if (hasta < desde) return setError('La fecha "hasta" no puede ser anterior a "desde".');
    let ruta = `/reportes/${vista}?desde=${desde}&hasta=${hasta}`;
    if (vista === 'mas-vendidos') ruta += `&orden=${orden}&limite=10`;
    if (vista === 'cierres' && soloDiferencias) ruta += '&con_diferencia=true';
    try {
      setDatos(await pedir(ruta));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    cargar();
  }, [vista, orden, soloDiferencias]);

  // Si la API devuelve un objeto (resumen + detalle), se muestra cada parte.
  const partes = datos && !Array.isArray(datos)
    ? Object.entries(datos)
    : null;

  return (
    <>
      <h1>Reportes</h1>

      <Tarjeta>
        <div className="catalogo-filtros">
          <Campo etiqueta="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <Campo etiqueta="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <Boton onClick={cargar}>Ver reporte</Boton>
        </div>
        <fieldset className="cobro-medios">
          <legend>Qué querés ver</legend>
          <Boton variante={vista === 'ventas' ? 'primario' : 'secundario'} aria-pressed={vista === 'ventas'} onClick={() => setVista('ventas')}>Ventas</Boton>
          <Boton variante={vista === 'mas-vendidos' ? 'primario' : 'secundario'} aria-pressed={vista === 'mas-vendidos'} onClick={() => setVista('mas-vendidos')}>Más vendidos</Boton>
          <Boton variante={vista === 'cierres' ? 'primario' : 'secundario'} aria-pressed={vista === 'cierres'} onClick={() => setVista('cierres')}>Cierres de caja</Boton>
        </fieldset>

        {vista === 'mas-vendidos' && (
          <div className="campo">
            <label htmlFor="rep-orden">Ordenar por</label>
            <select id="rep-orden" value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="unidades">Unidades vendidas</option>
              <option value="importe">Importe</option>
            </select>
          </div>
        )}
        {vista === 'cierres' && (
          <label>
            <input type="checkbox" checked={soloDiferencias} onChange={(e) => setSoloDiferencias(e.target.checked)} /> Solo cierres con diferencia
          </label>
        )}
      </Tarjeta>

      {error && <Mensaje tipo="error">{error}</Mensaje>}
      {datos === null && !error && <Estado tipo="cargando" />}

      {datos && Array.isArray(datos) && (
        <Tarjeta titulo={vista === 'ventas' ? 'Ventas del período' : vista === 'mas-vendidos' ? 'Productos más vendidos' : 'Cierres de caja'}>
          <TablaDatos filas={datos} />
        </Tarjeta>
      )}

      {partes &&
        partes.map(([nombre, valor]) => (
          <Tarjeta key={nombre} titulo={titulo(nombre)}>
            {Array.isArray(valor) ? (
              <TablaDatos filas={valor} />
            ) : valor !== null && typeof valor === 'object' ? (
              <TablaDatos filas={[valor]} />
            ) : (
              <p><strong>{formatear(nombre, valor)}</strong></p>
            )}
          </Tarjeta>
        ))}
    </>
  );
}
