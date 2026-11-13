import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

// Acciones que hoy deja registradas el sistema.
const ACCIONES = {
  CIERRE_CAJA: 'Cierre de caja',
  CAMBIO_PRECIO: 'Cambio de precio',
  ALTA_USUARIO: 'Alta de usuario',
  EDICION_USUARIO: 'Edición de usuario',
};

// "antes" y "despues" pueden llegar como objeto o como texto JSON.
function comoObjeto(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'string') {
    try { return JSON.parse(valor); } catch { return valor; }
  }
  return valor;
}

// Muestra un objeto como lista "campo: valor" en lugar de JSON crudo.
const NOMBRES = {
  nombre: 'Nombre', rol: 'Rol', activo: 'Activo', clave_cambiada: 'Cambió la clave',
  precio_mostrador: 'Precio mostrador', precio_mesa: 'Precio mesa',
  fecha_hora: 'Fecha y hora', fondo_fijo: 'Fondo fijo', efectivo_esperado: 'Efectivo esperado',
  efectivo_contado: 'Efectivo contado', diferencia: 'Diferencia', total_ventas: 'Total de ventas',
  cantidad_ventas: 'Cantidad de ventas', observacion: 'Observación', id: 'Id',
};

function textoValor(v) {
  if (v === true) return 'Sí';
  if (v === false) return 'No';
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' ? Object.values(x).join(' · ') : x)).join(' | ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function Datos({ titulo, datos }) {
  if (!datos) return null;
  if (typeof datos !== 'object') return <p>{titulo}: {String(datos)}</p>;
  return (
    <>
      <strong>{titulo}</strong>
      <dl className="auditoria-datos">
        {Object.entries(datos).map(([clave, valor]) => (
          <div key={clave}>
            <dt>{NOMBRES[clave] ?? clave}</dt>
            <dd>{textoValor(valor)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function Detalle({ fila }) {
  const antes = comoObjeto(fila.antes);
  const despues = comoObjeto(fila.despues);
  if (!antes && !despues) return '—';
  return (
    <details className="auditoria-detalle">
      <summary>Ver detalle</summary>
      <Datos titulo="Antes" datos={antes} />
      <Datos titulo="Después" datos={despues} />
    </details>
  );
}

export default function Auditoria() {
  const [filas, setFilas] = useState(null); // null = cargando
  const [error, setError] = useState('');
  const [accion, setAccion] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [buscando, setBuscando] = useState(false);

  // Sin argumentos usa los filtros escritos en pantalla; limpiar() pasa filtros vacíos.
  async function cargar(filtros = { accion, desde, hasta }) {
    setBuscando(true);
    setError('');
    const parametros = new URLSearchParams();
    if (filtros.accion) parametros.set('accion', filtros.accion);
    if (filtros.desde) parametros.set('desde', filtros.desde);
    if (filtros.hasta) parametros.set('hasta', filtros.hasta);
    const consulta = parametros.toString();
    try {
      setFilas(await pedir(`/auditoria${consulta ? `?${consulta}` : ''}`));
    } catch (err) {
      setError(err.message);
      setFilas([]);
    } finally {
      setBuscando(false);
    }
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function filtrar(e) {
    e.preventDefault();
    if (desde && hasta && desde > hasta) {
      setError('La fecha "desde" no puede ser posterior a "hasta".');
      return;
    }
    cargar();
  }

  function limpiar() {
    setAccion('');
    setDesde('');
    setHasta('');
    cargar({ accion: '', desde: '', hasta: '' });
  }

  const columnas = [
    { clave: 'fecha_hora', titulo: 'Fecha y hora', render: (f) => new Date(f.fecha_hora).toLocaleString('es-AR') },
    { clave: 'usuario', titulo: 'Usuario' },
    { clave: 'accion', titulo: 'Acción', render: (f) => ACCIONES[f.accion] ?? f.accion },
    { clave: 'entidad', titulo: 'Sobre', render: (f) => `${f.entidad} #${f.entidad_id ?? ''}` },
    { clave: 'detalle', titulo: 'Detalle', render: (f) => <Detalle fila={f} /> },
  ];

  return (
    <>
      <h1>Registro de acciones</h1>
      <Tarjeta>
        <p>Quién hizo qué y cuándo: cierres de caja, cambios de precios y altas o cambios de usuarios. Es solo de lectura.</p>

        <form onSubmit={filtrar} className="auditoria-filtros" noValidate>
          <div className="campo">
            <label htmlFor="aud-accion">Acción</label>
            <select id="aud-accion" value={accion} onChange={(e) => setAccion(e.target.value)}>
              <option value="">Todas</option>
              {Object.entries(ACCIONES).map(([valor, texto]) => (
                <option key={valor} value={valor}>{texto}</option>
              ))}
            </select>
          </div>
          <Campo etiqueta="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <Campo etiqueta="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <div className="auditoria-botones">
            <Boton type="submit" cargando={buscando} textoCargando="Buscando…">Filtrar</Boton>
            <Boton type="button" variante="secundario" onClick={limpiar}>Limpiar</Boton>
          </div>
        </form>

        {error && <Mensaje tipo="error">{error}</Mensaje>}
        {filas === null && !error && <Estado tipo="cargando" />}
        {filas && <Tabla columnas={columnas} filas={filas} claveFila="id" vacio="No hay acciones registradas con esos filtros." />}
        {filas && filas.length >= 100 && <p className="campo-ayuda">Se muestran las 100 acciones más recientes. Usá los filtros para acotar.</p>}
      </Tarjeta>
    </>
  );
}
