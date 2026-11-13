import { useState } from 'react';
import { pedir } from '../api/cliente.js';
import useLectorCodigos from '../hooks/useLectorCodigos.js';
import { dinero } from '../utils/dinero.js';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import PanelCobro from '../componentes/PanelCobro.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

export default function Venta() {
  const [items, setItems] = useState([]);           // lo que lleva la venta
  const [destino, setDestino] = useState('LLEVAR'); // 'LLEVAR' | 'MESA'
  const [mesa, setMesa] = useState('');
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState(null); // null = todavía no buscó
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState(null);          // { tipo, texto }

  // En mesa se cobra el precio de mesa; para llevar, el de mostrador.
  const precioDe = (p) => (destino === 'MESA' ? p.precio_mesa : p.precio_mostrador);
  const subtotal = items.reduce((suma, i) => suma + precioDe(i) * i.cantidad, 0);

  function agregar(producto) {
    setItems((actuales) => {
      const existe = actuales.find((i) => i.codigo === producto.codigo);
      if (existe) {
        return actuales.map((i) => (i.codigo === producto.codigo ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [...actuales, { ...producto, cantidad: 1 }];
    });
    setAviso({ tipo: 'exito', texto: `Agregado: ${producto.nombre}` });
  }

  function cambiarCantidad(codigo, delta) {
    setItems((actuales) =>
      actuales
        .map((i) => (i.codigo === codigo ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0) // si baja a 0, se quita
    );
  }

  function quitar(codigo) {
    setItems((actuales) => actuales.filter((i) => i.codigo !== codigo));
  }

  // Lo llama el lector de códigos cuando escanean algo.
  async function agregarPorCodigo(codigo) {
    try {
      const producto = await pedir(`/productos/${encodeURIComponent(codigo)}`);
      agregar(producto);
    } catch (err) {
      setAviso(
        err.status === 404
          ? { tipo: 'alerta', texto: `No existe un producto con el código ${codigo}.` }
          : { tipo: 'error', texto: err.message }
      );
    }
  }
  useLectorCodigos(agregarPorCodigo);

  async function buscar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setBuscando(true);
    try {
      setResultados(await pedir(`/productos/buscar?nombre=${encodeURIComponent(texto.trim())}`));
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setBuscando(false);
    }
  }

  // La API confirmó la venta: se vacía la pantalla y se avisa el número de ticket.
  // (El ticket completo en ventana es el paso siguiente, T-14.)
  function alRegistrar(ticket) {
    const vuelto = ticket.vuelto ? ` Vuelto: ${dinero(Number(ticket.vuelto))}.` : '';
    setAviso({
      tipo: 'exito',
      texto: `Venta registrada. Ticket N° ${ticket.numero_ticket}. Total ${dinero(Number(ticket.total))}.${vuelto}`,
    });
    setItems([]);
    setMesa('');
    setDestino('LLEVAR');
  }

  const columnasVenta = [
    { clave: 'nombre', titulo: 'Producto' },
    {
      clave: 'cantidad',
      titulo: 'Cantidad',
      render: (i) => (
        <span className="venta-cantidad">
          <Boton variante="secundario" aria-label={`Menos ${i.nombre}`} onClick={() => cambiarCantidad(i.codigo, -1)}>−</Boton>
          <strong>{i.cantidad}</strong>
          <Boton variante="secundario" aria-label={`Más ${i.nombre}`} onClick={() => cambiarCantidad(i.codigo, 1)}>+</Boton>
        </span>
      ),
    },
    { clave: 'precio', titulo: 'Subtotal', render: (i) => dinero(precioDe(i) * i.cantidad) },
    {
      clave: 'quitar',
      titulo: '',
      render: (i) => <Boton variante="peligro" aria-label={`Quitar ${i.nombre}`} onClick={() => quitar(i.codigo)}>Quitar</Boton>,
    },
  ];

  const columnasResultados = [
    { clave: 'nombre', titulo: 'Producto' },
    { clave: 'precio', titulo: 'Precio', render: (p) => dinero(precioDe(p)) },
    { clave: 'agregar', titulo: '', render: (p) => <Boton onClick={() => agregar(p)}>Agregar</Boton> },
  ];

  return (
    <>
      <h1>Venta</h1>
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <div className="venta">
        <Tarjeta titulo="Buscar producto">
          <form onSubmit={buscar} className="venta-buscador">
            <Campo
              etiqueta="Nombre del producto"
              ayuda="También podés escanear el código de barras en cualquier momento."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              autoFocus
            />
            <Boton type="submit" cargando={buscando} textoCargando="Buscando…">Buscar</Boton>
          </form>
          {resultados && (
            <Tabla columnas={columnasResultados} filas={resultados} claveFila="codigo" vacio="No encontramos productos con ese nombre." />
          )}
        </Tarjeta>

        <div className="venta-derecha">
          <Tarjeta titulo="Venta actual">
            <fieldset className="venta-destino">
              <legend>¿Para dónde es?</legend>
              <label>
                <input type="radio" name="destino" checked={destino === 'LLEVAR'} onChange={() => setDestino('LLEVAR')} /> Para llevar
              </label>
              <label>
                <input type="radio" name="destino" checked={destino === 'MESA'} onChange={() => setDestino('MESA')} /> Mesa
              </label>
            </fieldset>
            {destino === 'MESA' && (
              <Campo etiqueta="Número de mesa" type="number" min="1" value={mesa} onChange={(e) => setMesa(e.target.value)} />
            )}

            <Tabla columnas={columnasVenta} filas={items} claveFila="codigo" vacio="Todavía no agregaste productos." />

            <p className="venta-total">Total: <strong>{dinero(subtotal)}</strong></p>
            <Boton variante="secundario" disabled={items.length === 0} onClick={() => setItems([])}>Vaciar venta</Boton>
          </Tarjeta>

          <PanelCobro items={items} destino={destino} mesa={mesa} subtotal={subtotal} alRegistrar={alRegistrar} />
        </div>
      </div>
    </>
  );
}
