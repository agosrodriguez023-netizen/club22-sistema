import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Modal from '../componentes/Modal.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const ESTADOS = { PEDIDO: 'Pedido', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado' };

const fecha = (valor) => (valor ? new Date(valor).toLocaleDateString('es-AR') : '—');
const nombreProveedor = (p) => p.proveedor_nombre ?? p.proveedor ?? `Proveedor ${p.proveedor_id}`;

// Pedidos a proveedores: lista, pedido nuevo (T-56), ingreso con remito (T-50) y diferencias (T-52).
export default function Pedidos() {
  const [pedidos, setPedidos] = useState(null); // null = cargando
  const [errorLista, setErrorLista] = useState('');
  const [aviso, setAviso] = useState(null);
  const [filtro, setFiltro] = useState('');

  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);

  // Pedido nuevo
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [proveedorId, setProveedorId] = useState('');
  const [lineas, setLineas] = useState([]); // [{ codigo, nombre, cantidad }]
  const [codigoElegido, setCodigoElegido] = useState('');
  const [cantidadElegida, setCantidadElegida] = useState('1');
  const [observaciones, setObservaciones] = useState('');
  const [errorNuevo, setErrorNuevo] = useState('');

  // Detalle e ingreso
  const [detalle, setDetalle] = useState(null);
  const [recibidas, setRecibidas] = useState({}); // codigo -> texto
  const [remito, setRemito] = useState('');
  const [errorIngreso, setErrorIngreso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function cargar() {
    try {
      const ruta = filtro ? `/pedidos?estado=${filtro}` : '/pedidos';
      setPedidos(await pedir(ruta));
      setErrorLista('');
    } catch (err) {
      setErrorLista(err.message);
    }
  }
  useEffect(() => {
    cargar();
  }, [filtro]);

  useEffect(() => {
    pedir('/proveedores').then((l) => setProveedores(l.filter((p) => p.activo !== false))).catch(() => {});
    pedir('/productos/buscar?nombre=').then((l) => setProductos(l.filter((p) => p.controla_stock !== false))).catch(() => {});
  }, []);

  // ---------- Pedido nuevo ----------
  function abrirNuevo() {
    setProveedorId('');
    setLineas([]);
    setCodigoElegido('');
    setCantidadElegida('1');
    setObservaciones('');
    setErrorNuevo('');
    setNuevoAbierto(true);
  }

  function agregarLinea() {
    const cantidad = Number(cantidadElegida);
    if (!codigoElegido) return setErrorNuevo('Elegí un producto para agregar.');
    if (!Number.isInteger(cantidad) || cantidad < 1) return setErrorNuevo('La cantidad tiene que ser un número entero mayor a 0.');
    setErrorNuevo('');
    const producto = productos.find((p) => p.codigo === codigoElegido);
    setLineas((actuales) => {
      const existe = actuales.find((l) => l.codigo === codigoElegido);
      if (existe) return actuales.map((l) => (l.codigo === codigoElegido ? { ...l, cantidad: l.cantidad + cantidad } : l));
      return [...actuales, { codigo: codigoElegido, nombre: producto?.nombre ?? codigoElegido, cantidad }];
    });
    setCodigoElegido('');
    setCantidadElegida('1');
  }

  async function crearPedido(e) {
    e.preventDefault();
    setErrorNuevo('');
    if (!proveedorId) return setErrorNuevo('Elegí el proveedor.');
    if (lineas.length === 0) return setErrorNuevo('Agregá al menos un producto al pedido.');
    setOcupado(true);
    try {
      await pedir('/pedidos', {
        method: 'POST',
        body: {
          proveedor_id: Number(proveedorId),
          items: lineas.map((l) => ({ codigo: l.codigo, cantidad: l.cantidad })),
          observaciones: observaciones.trim() || undefined,
        },
      });
      setNuevoAbierto(false);
      setAviso({ tipo: 'exito', texto: 'Pedido creado.' });
      cargar();
    } catch (err) {
      setErrorNuevo(err.message);
    } finally {
      setOcupado(false);
    }
  }

  // ---------- Detalle e ingreso ----------
  async function abrirDetalle(p) {
    setErrorIngreso('');
    setRemito('');
    try {
      const completo = await pedir(`/pedidos/${p.id}`);
      setDetalle(completo);
      // Por defecto se propone lo pedido como recibido
      setRecibidas(Object.fromEntries((completo.items ?? []).map((i) => [i.codigo, String(i.cantidad_pedida)])));
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  }

  async function registrarIngreso(e) {
    e.preventDefault();
    setErrorIngreso('');
    if (!remito.trim()) return setErrorIngreso('El número de remito es obligatorio.');
    const items = [];
    for (const i of detalle.items) {
      const n = Number(recibidas[i.codigo]);
      if (recibidas[i.codigo] === '' || !Number.isInteger(n) || n < 0) {
        return setErrorIngreso(`La cantidad recibida de ${i.nombre} tiene que ser un número entero, 0 o más.`);
      }
      items.push({ codigo: i.codigo, cantidad_recibida: n });
    }
    setOcupado(true);
    try {
      const res = await pedir(`/pedidos/${detalle.id}/ingreso`, { method: 'POST', body: { numero_remito: remito.trim(), items } });
      setDetalle(null);
      setAviso(
        res.completo
          ? { tipo: 'exito', texto: 'Ingreso registrado: llegó todo lo pedido y el stock ya está actualizado.' }
          : { tipo: 'alerta', texto: 'Ingreso registrado con diferencias entre lo pedido y lo recibido. Revisalas en el detalle del pedido.' }
      );
      cargar();
    } catch (err) {
      setErrorIngreso(err.message);
    } finally {
      setOcupado(false);
    }
  }

  async function cancelarPedido() {
    setOcupado(true);
    try {
      await pedir(`/pedidos/${detalle.id}/cancelar`, { method: 'POST' });
      setDetalle(null);
      setAviso({ tipo: 'exito', texto: 'Pedido cancelado.' });
      cargar();
    } catch (err) {
      setErrorIngreso(err.message);
    } finally {
      setOcupado(false);
    }
  }

  const columnas = [
    { clave: 'id', titulo: 'N°' },
    { clave: 'proveedor', titulo: 'Proveedor', render: (p) => nombreProveedor(p) },
    { clave: 'fecha_pedido', titulo: 'Fecha', render: (p) => fecha(p.fecha_pedido) },
    { clave: 'estado', titulo: 'Estado', render: (p) => ESTADOS[p.estado] ?? p.estado },
    { clave: 'remito', titulo: 'Remito', render: (p) => p.numero_remito ?? '—' },
    {
      clave: 'ver',
      titulo: '',
      render: (p) => (
        <Boton variante="secundario" aria-label={`Ver pedido ${p.id}`} onClick={() => abrirDetalle(p)}>
          {p.estado === 'PEDIDO' ? 'Recibir' : 'Ver'}
        </Boton>
      ),
    },
  ];

  const esPendiente = detalle?.estado === 'PEDIDO';

  const columnasDetalle = [
    { clave: 'nombre', titulo: 'Producto' },
    { clave: 'cantidad_pedida', titulo: 'Pedido' },
    {
      clave: 'recibido',
      titulo: 'Recibido',
      render: (i) =>
        esPendiente ? (
          <input
            type="number"
            min="0"
            step="1"
            aria-label={`Cantidad recibida de ${i.nombre}`}
            value={recibidas[i.codigo] ?? ''}
            onChange={(e) => setRecibidas({ ...recibidas, [i.codigo]: e.target.value })}
          />
        ) : (
          i.cantidad_recibida ?? '—'
        ),
    },
    {
      clave: 'diferencia',
      titulo: 'Diferencia',
      render: (i) => {
        const recibida = esPendiente ? Number(recibidas[i.codigo]) : i.cantidad_recibida;
        if (recibida === null || recibida === undefined || Number.isNaN(recibida)) return '—';
        const dif = recibida - i.cantidad_pedida;
        if (dif === 0) return 'Completo';
        return dif < 0 ? `Faltan ${Math.abs(dif)}` : `Sobran ${dif}`;
      },
    },
  ];

  return (
    <>
      <h1>Pedidos a proveedores</h1>
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta>
        <div className="catalogo-filtros">
          <div className="campo">
            <label htmlFor="pedidos-estado">Estado</label>
            <select id="pedidos-estado" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Todos</option>
              <option value="PEDIDO">Pedido (esperando mercadería)</option>
              <option value="ENTREGADO">Entregado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          <Boton onClick={abrirNuevo}>Nuevo pedido</Boton>
        </div>
        {pedidos === null && !errorLista && <Estado tipo="cargando" />}
        {errorLista && <Estado tipo="error">{errorLista}</Estado>}
        {pedidos && <Tabla columnas={columnas} filas={pedidos} claveFila="id" vacio="No hay pedidos con ese filtro." />}
      </Tarjeta>

      <Modal abierto={nuevoAbierto} titulo="Nuevo pedido" onCerrar={() => setNuevoAbierto(false)}>
        <form onSubmit={crearPedido} noValidate>
          {errorNuevo && <Mensaje tipo="error">{errorNuevo}</Mensaje>}
          <div className="campo">
            <label htmlFor="pedido-proveedor">Proveedor</label>
            <select id="pedido-proveedor" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
              <option value="">Elegí un proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="pedido-producto">Producto</label>
            <select id="pedido-producto" value={codigoElegido} onChange={(e) => setCodigoElegido(e.target.value)}>
              <option value="">Elegí un producto</option>
              {productos.map((p) => (
                <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <Campo etiqueta="Cantidad" type="number" min="1" step="1" value={cantidadElegida} onChange={(e) => setCantidadElegida(e.target.value)} />
          <Boton type="button" variante="secundario" onClick={agregarLinea}>Agregar al pedido</Boton>

          <Tabla
            columnas={[
              { clave: 'nombre', titulo: 'Producto' },
              { clave: 'cantidad', titulo: 'Cantidad' },
              {
                clave: 'quitar',
                titulo: '',
                render: (l) => (
                  <Boton type="button" variante="peligro" aria-label={`Quitar ${l.nombre}`} onClick={() => setLineas(lineas.filter((x) => x.codigo !== l.codigo))}>
                    Quitar
                  </Boton>
                ),
              },
            ]}
            filas={lineas}
            claveFila="codigo"
            vacio="Todavía no agregaste productos."
          />

          <Campo etiqueta="Observaciones (opcional)" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} maxLength={200} />
          <div className="modal-acciones">
            <Boton type="button" variante="secundario" onClick={() => setNuevoAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={ocupado} textoCargando="Creando…">Crear pedido</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={detalle !== null} titulo={detalle ? `Pedido N° ${detalle.id} · ${ESTADOS[detalle.estado] ?? detalle.estado}` : ''} onCerrar={() => setDetalle(null)}>
        {detalle && (
          <form onSubmit={registrarIngreso} noValidate>
            {errorIngreso && <Mensaje tipo="error">{errorIngreso}</Mensaje>}
            <p>
              Proveedor: <strong>{nombreProveedor(detalle)}</strong> · Pedido el {fecha(detalle.fecha_pedido)}
              {detalle.numero_remito && <> · Remito: <strong>{detalle.numero_remito}</strong></>}
            </p>
            {detalle.observaciones && <p className="campo-ayuda">{detalle.observaciones}</p>}
            <Tabla columnas={columnasDetalle} filas={detalle.items ?? []} claveFila="codigo" vacio="El pedido no tiene productos." />
            {esPendiente && (
              <>
                <Campo etiqueta="Número de remito" value={remito} onChange={(e) => setRemito(e.target.value)} maxLength={30} autoComplete="off" />
                <div className="modal-acciones">
                  <Boton type="button" variante="peligro" onClick={cancelarPedido} disabled={ocupado}>Cancelar pedido</Boton>
                  <Boton type="submit" cargando={ocupado} textoCargando="Registrando…">Registrar ingreso</Boton>
                </div>
              </>
            )}
            {!esPendiente && (
              <div className="modal-acciones">
                <Boton type="button" variante="secundario" onClick={() => setDetalle(null)}>Cerrar</Boton>
              </div>
            )}
          </form>
        )}
      </Modal>
    </>
  );
}
