import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Modal from '../componentes/Modal.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const hoy = () => new Date().toLocaleDateString('en-CA');
const solo = (v) => (typeof v === 'string' ? v.slice(0, 10) : v);
const hora = (v) => (typeof v === 'string' ? v.slice(0, 5) : v);

const FORM_VACIO = () => ({
  nombre: '',
  tipo: 'PORCENTAJE',
  porcentaje: '',
  alcance: 'TODO', // TODO | CATEGORIA | PRODUCTO
  categoria: '',
  producto_codigo: '',
  fecha_desde: hoy(),
  fecha_hasta: hoy(),
  dias_semana: [0, 1, 2, 3, 4, 5, 6],
  hora_desde: '',
  hora_hasta: '',
  activo: true,
});

// Promociones reutilizables (HU-22): porcentaje o Happy Hour, por categoría o producto, con fechas, días y horario.
export default function Promociones() {
  const [lista, setLista] = useState(null); // null = cargando
  const [errorLista, setErrorLista] = useState('');
  const [aviso, setAviso] = useState(null);
  const [productos, setProductos] = useState([]);

  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO());
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [paraDuplicar, setParaDuplicar] = useState(null);
  const [fechasDup, setFechasDup] = useState({ fecha_desde: hoy(), fecha_hasta: hoy() });
  const [errorDup, setErrorDup] = useState('');

  async function cargar() {
    try {
      setLista(await pedir('/promociones'));
      setErrorLista('');
    } catch (err) {
      setErrorLista(err.message);
    }
  }
  useEffect(() => {
    cargar();
    pedir('/productos/buscar?nombre=').then(setProductos).catch(() => {});
  }, []);

  const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort();

  function abrirNueva() {
    setEditando(null);
    setForm(FORM_VACIO());
    setErrorForm('');
    setAbierto(true);
  }

  function abrirEditar(p) {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      tipo: p.tipo,
      porcentaje: String(Number(p.porcentaje)),
      alcance: p.producto_codigo ? 'PRODUCTO' : p.categoria ? 'CATEGORIA' : 'TODO',
      categoria: p.categoria ?? '',
      producto_codigo: p.producto_codigo ?? '',
      fecha_desde: solo(p.fecha_desde),
      fecha_hasta: solo(p.fecha_hasta),
      dias_semana: p.dias_semana ?? [0, 1, 2, 3, 4, 5, 6],
      hora_desde: hora(p.hora_desde) ?? '',
      hora_hasta: hora(p.hora_hasta) ?? '',
      activo: p.activo !== false,
    });
    setErrorForm('');
    setAbierto(true);
  }

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  function alternarDia(d) {
    const dias = form.dias_semana.includes(d) ? form.dias_semana.filter((x) => x !== d) : [...form.dias_semana, d].sort();
    setForm({ ...form, dias_semana: dias });
  }

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');
    const porcentaje = Number(form.porcentaje);
    if (!form.nombre.trim()) return setErrorForm('Ingresá el nombre de la promoción.');
    if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) return setErrorForm('El porcentaje tiene que ser mayor a 0 y hasta 100.');
    if (form.alcance === 'CATEGORIA' && !form.categoria) return setErrorForm('Elegí la categoría.');
    if (form.alcance === 'PRODUCTO' && !form.producto_codigo) return setErrorForm('Elegí el producto.');
    if (!form.fecha_desde || !form.fecha_hasta) return setErrorForm('Indicá desde y hasta qué fecha vale.');
    if (form.fecha_hasta < form.fecha_desde) return setErrorForm('La fecha de fin no puede ser anterior a la de inicio.');
    if (form.dias_semana.length === 0) return setErrorForm('Elegí al menos un día de la semana.');
    if (Boolean(form.hora_desde) !== Boolean(form.hora_hasta)) return setErrorForm('Indicá la hora de inicio y la de fin, o ninguna.');
    if (form.hora_desde && form.hora_hasta <= form.hora_desde) return setErrorForm('La hora de fin tiene que ser posterior a la de inicio.');
    if (form.tipo === 'HAPPY_HOUR' && !form.hora_desde) return setErrorForm('El Happy Hour necesita un horario.');

    const cuerpo = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      porcentaje,
      categoria: form.alcance === 'CATEGORIA' ? form.categoria : null,
      producto_codigo: form.alcance === 'PRODUCTO' ? form.producto_codigo : null,
      fecha_desde: form.fecha_desde,
      fecha_hasta: form.fecha_hasta,
      dias_semana: form.dias_semana,
      hora_desde: form.hora_desde || null,
      hora_hasta: form.hora_hasta || null,
      activo: form.activo,
    };
    setGuardando(true);
    try {
      if (editando) {
        await pedir(`/promociones/${editando.id}`, { method: 'PUT', body: cuerpo });
        setAviso({ tipo: 'exito', texto: `Se guardaron los cambios de ${cuerpo.nombre}.` });
      } else {
        await pedir('/promociones', { method: 'POST', body: cuerpo });
        setAviso({ tipo: 'exito', texto: `Promoción ${cuerpo.nombre} creada.` });
      }
      setAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActiva(p) {
    try {
      await pedir(`/promociones/${p.id}`, { method: 'PUT', body: { activo: p.activo === false } });
      setAviso({ tipo: 'exito', texto: p.activo === false ? `${p.nombre} se activó.` : `${p.nombre} se desactivó.` });
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  }

  async function duplicar() {
    setErrorDup('');
    if (!fechasDup.fecha_desde || !fechasDup.fecha_hasta) return setErrorDup('Indicá las nuevas fechas.');
    if (fechasDup.fecha_hasta < fechasDup.fecha_desde) return setErrorDup('La fecha de fin no puede ser anterior a la de inicio.');
    try {
      await pedir(`/promociones/${paraDuplicar.id}/duplicar`, { method: 'POST', body: fechasDup });
      setAviso({ tipo: 'exito', texto: `Se creó una copia de ${paraDuplicar.nombre} con las nuevas fechas.` });
      setParaDuplicar(null);
      cargar();
    } catch (err) {
      setErrorDup(err.message);
    }
  }

  const alcanceDe = (p) => (p.producto_codigo ? `Producto ${p.producto_codigo}` : p.categoria ? `Categoría ${p.categoria}` : 'Toda la carta');

  const columnas = [
    { clave: 'nombre', titulo: 'Promoción' },
    { clave: 'tipo', titulo: 'Tipo', render: (p) => (p.tipo === 'HAPPY_HOUR' ? 'Happy Hour' : 'Porcentaje') },
    { clave: 'porcentaje', titulo: 'Descuento', render: (p) => `${Number(p.porcentaje)} %` },
    { clave: 'alcance', titulo: 'Aplica a', render: alcanceDe },
    { clave: 'fechas', titulo: 'Vigencia', render: (p) => `${solo(p.fecha_desde)} al ${solo(p.fecha_hasta)}` },
    { clave: 'dias', titulo: 'Días', render: (p) => (p.dias_semana ?? []).map((d) => DIAS[d]).join(' ') },
    { clave: 'horario', titulo: 'Horario', render: (p) => (p.hora_desde ? `${hora(p.hora_desde)} a ${hora(p.hora_hasta)}` : 'Todo el día') },
    { clave: 'activo', titulo: 'Estado', render: (p) => (p.activo === false ? 'Inactiva' : 'Activa') },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      render: (p) => (
        <span className="usuarios-acciones">
          <Boton variante="secundario" aria-label={`Editar ${p.nombre}`} onClick={() => abrirEditar(p)}>Editar</Boton>
          <Boton variante="secundario" aria-label={`Duplicar ${p.nombre}`} onClick={() => { setErrorDup(''); setFechasDup({ fecha_desde: hoy(), fecha_hasta: hoy() }); setParaDuplicar(p); }}>Duplicar</Boton>
          <Boton variante="secundario" aria-label={`${p.activo === false ? 'Activar' : 'Desactivar'} ${p.nombre}`} onClick={() => alternarActiva(p)}>
            {p.activo === false ? 'Activar' : 'Desactivar'}
          </Boton>
        </span>
      ),
    },
  ];

  return (
    <>
      <h1>Promociones</h1>
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta>
        <Boton onClick={abrirNueva}>Nueva promoción</Boton>
        {lista === null && !errorLista && <Estado tipo="cargando" />}
        {errorLista && <Estado tipo="error">{errorLista}</Estado>}
        {lista && <Tabla columnas={columnas} filas={lista} claveFila="id" vacio="Todavía no hay promociones." />}
      </Tarjeta>

      <Modal abierto={abierto} titulo={editando ? `Editar ${editando.nombre}` : 'Nueva promoción'} onCerrar={() => setAbierto(false)}>
        <form onSubmit={guardar} noValidate>
          {errorForm && <Mensaje tipo="error">{errorForm}</Mensaje>}
          <Campo etiqueta="Nombre" value={form.nombre} onChange={cambiar('nombre')} maxLength={80} autoComplete="off" />
          <div className="campo">
            <label htmlFor="promo-tipo">Tipo</label>
            <select id="promo-tipo" value={form.tipo} onChange={cambiar('tipo')}>
              <option value="PORCENTAJE">Porcentaje de descuento</option>
              <option value="HAPPY_HOUR">Happy Hour (con horario)</option>
            </select>
          </div>
          <Campo etiqueta="Descuento (%)" type="number" min="1" max="100" step="any" value={form.porcentaje} onChange={cambiar('porcentaje')} />

          <div className="campo">
            <label htmlFor="promo-alcance">Aplica a</label>
            <select id="promo-alcance" value={form.alcance} onChange={cambiar('alcance')}>
              <option value="TODO">Toda la carta</option>
              <option value="CATEGORIA">Una categoría</option>
              <option value="PRODUCTO">Un producto</option>
            </select>
          </div>
          {form.alcance === 'CATEGORIA' && (
            <div className="campo">
              <label htmlFor="promo-categoria">Categoría</label>
              <select id="promo-categoria" value={form.categoria} onChange={cambiar('categoria')}>
                <option value="">Elegí una categoría</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          {form.alcance === 'PRODUCTO' && (
            <div className="campo">
              <label htmlFor="promo-producto">Producto</label>
              <select id="promo-producto" value={form.producto_codigo} onChange={cambiar('producto_codigo')}>
                <option value="">Elegí un producto</option>
                {productos.map((p) => (
                  <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <Campo etiqueta="Vale desde" type="date" value={form.fecha_desde} onChange={cambiar('fecha_desde')} />
          <Campo etiqueta="Vale hasta" type="date" value={form.fecha_hasta} onChange={cambiar('fecha_hasta')} />

          <fieldset className="cobro-medios">
            <legend>Días de la semana</legend>
            {DIAS.map((nombre, d) => (
              <Boton key={d} type="button" variante={form.dias_semana.includes(d) ? 'primario' : 'secundario'} aria-pressed={form.dias_semana.includes(d)} onClick={() => alternarDia(d)}>
                {nombre}
              </Boton>
            ))}
          </fieldset>

          <Campo etiqueta="Desde la hora (opcional)" type="time" value={form.hora_desde} onChange={cambiar('hora_desde')} />
          <Campo etiqueta="Hasta la hora (opcional)" type="time" value={form.hora_hasta} onChange={cambiar('hora_hasta')} />

          <label>
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Promoción activa
          </label>

          <div className="modal-acciones">
            <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={guardando} textoCargando="Guardando…">Guardar</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={paraDuplicar !== null} titulo={paraDuplicar ? `Duplicar ${paraDuplicar.nombre}` : ''} onCerrar={() => setParaDuplicar(null)}>
        {errorDup && <Mensaje tipo="error">{errorDup}</Mensaje>}
        <p>Se crea una copia con las mismas reglas y las fechas nuevas.</p>
        <Campo etiqueta="Nueva fecha de inicio" type="date" value={fechasDup.fecha_desde} onChange={(e) => setFechasDup({ ...fechasDup, fecha_desde: e.target.value })} />
        <Campo etiqueta="Nueva fecha de fin" type="date" value={fechasDup.fecha_hasta} onChange={(e) => setFechasDup({ ...fechasDup, fecha_hasta: e.target.value })} />
        <div className="modal-acciones">
          <Boton variante="secundario" onClick={() => setParaDuplicar(null)}>Cancelar</Boton>
          <Boton onClick={duplicar}>Crear copia</Boton>
        </div>
      </Modal>
    </>
  );
}
