import { useEffect, useMemo, useState } from 'react';
import { pedir } from '../api/cliente.js';
import { useAuth } from '../context/AuthContext.jsx';
import { dinero } from '../utils/dinero.js';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Modal from '../componentes/Modal.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const FORM_VACIO = { codigo: '', nombre: '', categoria: '', precio_mostrador: '', precio_mesa: '' };

export default function Catalogo() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'ADMINISTRADOR'; // solo el Administrador edita; el resto consulta

  const [productos, setProductos] = useState(null); // null = cargando
  const [errorLista, setErrorLista] = useState('');
  const [aviso, setAviso] = useState(null);
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState('');

  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // null = producto nuevo
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [paraBaja, setParaBaja] = useState(null);

  async function cargar() {
    try {
      setProductos(await pedir('/productos/buscar?nombre='));
      setErrorLista('');
    } catch (err) {
      setErrorLista(err.message);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  const categorias = useMemo(
    () => [...new Set((productos ?? []).map((p) => p.categoria).filter(Boolean))].sort(),
    [productos]
  );

  // Búsqueda y filtro en pantalla, sin volver a pedir a la API.
  const visibles = (productos ?? []).filter((p) => {
    const coincideNombre = p.nombre.toLowerCase().includes(texto.trim().toLowerCase());
    const coincideCategoria = !categoria || p.categoria === categoria;
    return coincideNombre && coincideCategoria;
  });

  function abrirNuevo() {
    setEditando(null);
    setForm(FORM_VACIO);
    setErrorForm('');
    setAbierto(true);
  }

  function abrirEditar(p) {
    setEditando(p);
    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      categoria: p.categoria ?? '',
      precio_mostrador: String(Number(p.precio_mostrador)),
      precio_mesa: String(Number(p.precio_mesa)),
    });
    setErrorForm('');
    setAbierto(true);
  }

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');
    const mostrador = Number(form.precio_mostrador);
    const mesa = Number(form.precio_mesa);
    if (!editando && !form.codigo.trim()) return setErrorForm('Ingresá el código del producto.');
    if (!form.nombre.trim()) return setErrorForm('Ingresá el nombre del producto.');
    if (form.precio_mostrador === '' || !Number.isFinite(mostrador) || mostrador < 0) return setErrorForm('El precio de mostrador tiene que ser un número de 0 o más.');
    if (form.precio_mesa === '' || !Number.isFinite(mesa) || mesa < 0) return setErrorForm('El precio de mesa tiene que ser un número de 0 o más.');

    setGuardando(true);
    try {
      if (editando) {
        // 1) datos del producto
        await pedir(`/productos/${encodeURIComponent(editando.codigo)}`, {
          method: 'PUT',
          body: { nombre: form.nombre.trim(), categoria: form.categoria.trim() || null },
        });
        // 2) precios: solo si cambiaron (el backend deja el registro de quién y cuándo)
        if (mostrador !== Number(editando.precio_mostrador) || mesa !== Number(editando.precio_mesa)) {
          await pedir(`/productos/${encodeURIComponent(editando.codigo)}/precio`, {
            method: 'PUT',
            body: { precio_mostrador: mostrador, precio_mesa: mesa, usuario_id: usuario.id },
          });
        }
        setAviso({ tipo: 'exito', texto: `Se guardaron los cambios de ${form.nombre.trim()}.` });
      } else {
        await pedir('/productos', {
          method: 'POST',
          body: {
            codigo: form.codigo.trim(),
            nombre: form.nombre.trim(),
            categoria: form.categoria.trim() || null,
            precio_mostrador: mostrador,
            precio_mesa: mesa,
          },
        });
        setAviso({ tipo: 'exito', texto: `Producto ${form.nombre.trim()} creado.` });
      }
      setAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBaja() {
    const p = paraBaja;
    try {
      await pedir(`/productos/${encodeURIComponent(p.codigo)}`, { method: 'DELETE' });
      setAviso({ tipo: 'exito', texto: `${p.nombre} se dio de baja (ya no aparece en las ventas).` });
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setParaBaja(null);
    }
  }

  const columnas = [
    { clave: 'codigo', titulo: 'Código' },
    { clave: 'nombre', titulo: 'Producto' },
    { clave: 'categoria', titulo: 'Categoría', render: (p) => p.categoria ?? '—' },
    { clave: 'precio_mostrador', titulo: 'Mostrador', render: (p) => dinero(Number(p.precio_mostrador)) },
    { clave: 'precio_mesa', titulo: 'Mesa', render: (p) => dinero(Number(p.precio_mesa)) },
    { clave: 'stock_actual', titulo: 'Stock', render: (p) => (p.controla_stock === false ? 'No controla' : p.stock_actual) },
  ];
  if (esAdmin) {
    columnas.push({
      clave: 'acciones',
      titulo: 'Acciones',
      render: (p) => (
        <span className="usuarios-acciones">
          <Boton variante="secundario" aria-label={`Editar ${p.nombre}`} onClick={() => abrirEditar(p)}>Editar</Boton>
          <Boton variante="peligro" aria-label={`Dar de baja ${p.nombre}`} onClick={() => setParaBaja(p)}>Baja</Boton>
        </span>
      ),
    });
  }

  return (
    <>
      <h1>Productos y precios</h1>
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta>
        <div className="catalogo-filtros">
          <Campo etiqueta="Buscar por nombre" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <div className="campo">
            <label htmlFor="catalogo-categoria">Categoría</label>
            <select id="catalogo-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {esAdmin && <Boton onClick={abrirNuevo}>Nuevo producto</Boton>}
        </div>
        {!esAdmin && <p className="campo-ayuda">Solo el Administrador puede cambiar productos y precios.</p>}

        {productos === null && !errorLista && <Estado tipo="cargando" />}
        {errorLista && <Estado tipo="error">{errorLista}</Estado>}
        {productos && <Tabla columnas={columnas} filas={visibles} claveFila="codigo" vacio="No hay productos con ese filtro." />}
      </Tarjeta>

      <Modal abierto={abierto} titulo={editando ? `Editar ${editando.nombre}` : 'Nuevo producto'} onCerrar={() => setAbierto(false)}>
        <form onSubmit={guardar} noValidate>
          {errorForm && <Mensaje tipo="error">{errorForm}</Mensaje>}
          <Campo etiqueta="Código de barras" value={form.codigo} onChange={cambiar('codigo')} disabled={Boolean(editando)} autoComplete="off" />
          <Campo etiqueta="Nombre" value={form.nombre} onChange={cambiar('nombre')} autoComplete="off" />
          <Campo etiqueta="Categoría" value={form.categoria} onChange={cambiar('categoria')} list="catalogo-categorias" autoComplete="off" />
          <datalist id="catalogo-categorias">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Campo etiqueta="Precio de mostrador ($)" type="number" min="0" value={form.precio_mostrador} onChange={cambiar('precio_mostrador')} />
          <Campo etiqueta="Precio de mesa ($)" type="number" min="0" value={form.precio_mesa} onChange={cambiar('precio_mesa')} />
          <div className="modal-acciones">
            <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={guardando} textoCargando="Guardando…">Guardar</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={paraBaja !== null} titulo="Dar de baja el producto" onCerrar={() => setParaBaja(null)}>
        <p>{paraBaja?.nombre} dejará de aparecer en las ventas. El historial de ventas anteriores se conserva. ¿Confirmás la baja?</p>
        <div className="modal-acciones">
          <Boton variante="secundario" onClick={() => setParaBaja(null)}>Cancelar</Boton>
          <Boton variante="peligro" onClick={confirmarBaja}>Confirmar baja</Boton>
        </div>
      </Modal>
    </>
  );
}
