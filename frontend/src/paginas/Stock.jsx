import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Modal from '../componentes/Modal.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const TIPOS = { VENTA: 'Venta', INGRESO: 'Ingreso', AJUSTE: 'Ajuste', INICIAL: 'Conteo inicial' };
const fechaHora = (v) => (v ? new Date(v).toLocaleString('es-AR') : '—');

// Stock: listado, movimientos por producto (T-46) y conteo físico / inicial (T-58).
export default function Stock() {
  const [productos, setProductos] = useState(null); // null = cargando
  const [errorLista, setErrorLista] = useState('');
  const [aviso, setAviso] = useState(null);
  const [texto, setTexto] = useState('');
  const [soloAlertas, setSoloAlertas] = useState(false);

  // Movimientos
  const [movProducto, setMovProducto] = useState(null);
  const [movimientos, setMovimientos] = useState(null);
  const [errorMov, setErrorMov] = useState('');

  // Conteo
  const [conteoAbierto, setConteoAbierto] = useState(false);
  const [contados, setContados] = useState({}); // codigo -> texto
  const [motivo, setMotivo] = useState('');
  const [resultado, setResultado] = useState(null); // vista previa del conteo
  const [errorConteo, setErrorConteo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function cargar() {
    try {
      setProductos(await pedir(soloAlertas ? '/stock?alertas=1' : '/stock'));
      setErrorLista('');
    } catch (err) {
      setErrorLista(err.message);
    }
  }
  useEffect(() => {
    cargar();
  }, [soloAlertas]);

  const visibles = (productos ?? []).filter((p) => p.nombre.toLowerCase().includes(texto.trim().toLowerCase()));

  // ---------- Movimientos ----------
  async function verMovimientos(p) {
    setMovProducto(p);
    setMovimientos(null);
    setErrorMov('');
    try {
      setMovimientos(await pedir(`/stock/${encodeURIComponent(p.codigo)}/movimientos?limite=100`));
    } catch (err) {
      setErrorMov(err.message);
    }
  }

  // ---------- Conteo ----------
  function abrirConteo() {
    setContados({});
    setMotivo('');
    setResultado(null);
    setErrorConteo('');
    setConteoAbierto(true);
  }

  function itemsContados() {
    const items = [];
    for (const p of productos ?? []) {
      const valor = contados[p.codigo];
      if (valor === undefined || valor === '') continue;
      const n = Number(valor);
      if (!Number.isInteger(n) || n < 0) {
        throw new Error(`La cantidad contada de ${p.nombre} tiene que ser un número entero, 0 o más.`);
      }
      items.push({ codigo: p.codigo, contado: n });
    }
    if (items.length === 0) throw new Error('Cargá la cantidad contada de al menos un producto.');
    return items;
  }

  // Primero se compara (sin cambiar nada) y recién después se aplica.
  async function comparar() {
    setErrorConteo('');
    setOcupado(true);
    try {
      const res = await pedir('/stock/conteo', { method: 'POST', body: { items: itemsContados(), aplicar: false } });
      setResultado(res);
    } catch (err) {
      setErrorConteo(err.message);
    } finally {
      setOcupado(false);
    }
  }

  async function aplicar() {
    setErrorConteo('');
    if (motivo.trim().length < 3) return setErrorConteo('Escribí el motivo del conteo (al menos 3 letras).');
    setOcupado(true);
    try {
      await pedir('/stock/conteo', { method: 'POST', body: { items: itemsContados(), aplicar: true, motivo: motivo.trim() } });
      setConteoAbierto(false);
      setAviso({ tipo: 'exito', texto: 'Conteo aplicado: el stock quedó actualizado y los cambios figuran en los movimientos.' });
      cargar();
    } catch (err) {
      setErrorConteo(err.message);
    } finally {
      setOcupado(false);
    }
  }

  // La vista previa puede venir como lista o como { items: [...] }
  const filasResultado = Array.isArray(resultado) ? resultado : resultado?.items ?? [];
  const nombreDe = (codigo) => (productos ?? []).find((p) => p.codigo === codigo)?.nombre ?? codigo;

  const columnas = [
    { clave: 'nombre', titulo: 'Producto' },
    { clave: 'categoria', titulo: 'Categoría', render: (p) => p.categoria ?? '—' },
    { clave: 'stock_actual', titulo: 'Stock' },
    { clave: 'stock_minimo', titulo: 'Mínimo' },
    {
      clave: 'estado',
      titulo: 'Estado',
      render: (p) => (Number(p.stock_minimo) > 0 && Number(p.stock_actual) <= Number(p.stock_minimo) ? 'Stock bajo' : 'Normal'),
    },
    {
      clave: 'mov',
      titulo: '',
      render: (p) => (
        <Boton variante="secundario" aria-label={`Ver movimientos de ${p.nombre}`} onClick={() => verMovimientos(p)}>
          Movimientos
        </Boton>
      ),
    },
  ];

  const columnasMov = [
    { clave: 'fecha_hora', titulo: 'Fecha', render: (m) => fechaHora(m.fecha_hora) },
    { clave: 'tipo', titulo: 'Tipo', render: (m) => TIPOS[m.tipo] ?? m.tipo },
    { clave: 'cantidad', titulo: 'Cantidad', render: (m) => (Number(m.cantidad) > 0 ? `+${m.cantidad}` : m.cantidad) },
    { clave: 'stock_resultante', titulo: 'Stock resultante' },
    { clave: 'motivo', titulo: 'Motivo', render: (m) => m.motivo ?? '—' },
  ];

  return (
    <>
      <h1>Stock</h1>
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta>
        <div className="catalogo-filtros">
          <Campo etiqueta="Buscar por nombre" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <label>
            <input type="checkbox" checked={soloAlertas} onChange={(e) => setSoloAlertas(e.target.checked)} /> Solo stock bajo
          </label>
          <Boton onClick={abrirConteo} disabled={!productos}>Hacer un conteo</Boton>
        </div>
        {productos === null && !errorLista && <Estado tipo="cargando" />}
        {errorLista && <Estado tipo="error">{errorLista}</Estado>}
        {productos && <Tabla columnas={columnas} filas={visibles} claveFila="codigo" vacio="No hay productos con ese filtro." />}
      </Tarjeta>

      <Modal abierto={movProducto !== null} titulo={movProducto ? `Movimientos de ${movProducto.nombre}` : ''} onCerrar={() => setMovProducto(null)}>
        {errorMov && <Mensaje tipo="error">{errorMov}</Mensaje>}
        {movimientos === null && !errorMov && <Estado tipo="cargando" />}
        {movimientos && <Tabla columnas={columnasMov} filas={movimientos} claveFila="id" vacio="Este producto todavía no tiene movimientos." />}
        <div className="modal-acciones">
          <Boton variante="secundario" onClick={() => setMovProducto(null)}>Cerrar</Boton>
        </div>
      </Modal>

      <Modal abierto={conteoAbierto} titulo="Conteo de stock" onCerrar={() => setConteoAbierto(false)}>
        {errorConteo && <Mensaje tipo="error">{errorConteo}</Mensaje>}
        {!resultado && (
          <>
            <p>Escribí cuántas unidades contaste de cada producto. Los que dejes vacíos no se cuentan.</p>
            <Tabla
              columnas={[
                { clave: 'nombre', titulo: 'Producto' },
                { clave: 'stock_actual', titulo: 'En el sistema' },
                {
                  clave: 'contado',
                  titulo: 'Contado',
                  render: (p) => (
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`Cantidad contada de ${p.nombre}`}
                      value={contados[p.codigo] ?? ''}
                      onChange={(e) => setContados({ ...contados, [p.codigo]: e.target.value })}
                    />
                  ),
                },
              ]}
              filas={productos ?? []}
              claveFila="codigo"
              vacio="No hay productos."
            />
            <div className="modal-acciones">
              <Boton variante="secundario" onClick={() => setConteoAbierto(false)}>Cancelar</Boton>
              <Boton onClick={comparar} cargando={ocupado} textoCargando="Comparando…">Comparar con el sistema</Boton>
            </div>
          </>
        )}
        {resultado && (
          <>
            <p>Así quedaría el stock. Todavía no se cambió nada.</p>
            <Tabla
              columnas={[
                { clave: 'nombre', titulo: 'Producto', render: (i) => i.nombre ?? nombreDe(i.codigo) },
                { clave: 'sistema', titulo: 'En el sistema', render: (i) => i.stock_actual ?? i.stock_sistema ?? i.sistema ?? i.esperado ?? '—' },
                { clave: 'contado', titulo: 'Contado' },
                {
                  clave: 'diferencia',
                  titulo: 'Diferencia',
                  render: (i) => {
                    const dif = i.diferencia ?? (i.contado - (i.stock_actual ?? i.stock_sistema ?? i.sistema ?? i.esperado));
                    if (!Number.isFinite(Number(dif))) return '—';
                    return Number(dif) === 0 ? 'Sin diferencia' : Number(dif) > 0 ? `Sobran ${dif}` : `Faltan ${Math.abs(dif)}`;
                  },
                },
              ]}
              filas={filasResultado}
              claveFila="codigo"
              vacio="No hay diferencias para mostrar."
            />
            <Campo etiqueta="Motivo del conteo" ayuda="Por ejemplo: conteo inicial, o inventario de fin de mes." value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} />
            <div className="modal-acciones">
              <Boton variante="secundario" onClick={() => setResultado(null)}>Volver a contar</Boton>
              <Boton onClick={aplicar} cargando={ocupado} textoCargando="Aplicando…">Aplicar al stock</Boton>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
