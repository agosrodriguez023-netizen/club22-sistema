import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Modal from '../componentes/Modal.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const FORM_VACIO = { etiqueta: '', capacidad: '', ubicacion: '', observaciones: '' };

// Mesas del salón (HU-18): el Administrador las da de alta, edita y baja; Sala las consulta.
export default function Mesas() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'ADMINISTRADOR';

  const [mesas, setMesas] = useState(null); // null = cargando
  const [errorLista, setErrorLista] = useState('');
  const [aviso, setAviso] = useState(null);

  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [paraBaja, setParaBaja] = useState(null);
  const [errorBaja, setErrorBaja] = useState('');

  async function cargar() {
    try {
      setMesas(await pedir('/mesas'));
      setErrorLista('');
    } catch (err) {
      setErrorLista(err.message);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  function abrirNueva() {
    setEditando(null);
    setForm(FORM_VACIO);
    setErrorForm('');
    setAbierto(true);
  }

  function abrirEditar(m) {
    setEditando(m);
    setForm({ etiqueta: m.etiqueta, capacidad: String(m.capacidad), ubicacion: m.ubicacion ?? '', observaciones: m.observaciones ?? '' });
    setErrorForm('');
    setAbierto(true);
  }

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');
    const capacidad = Number(form.capacidad);
    if (!form.etiqueta.trim()) return setErrorForm('Ingresá la etiqueta de la mesa (por ejemplo "Mesa 5").');
    if (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > 50) return setErrorForm('La capacidad tiene que ser un número entero entre 1 y 50.');
    if (!form.ubicacion.trim()) return setErrorForm('Ingresá la ubicación (por ejemplo "Salón" o "Vereda").');

    const cuerpo = {
      etiqueta: form.etiqueta.trim(),
      capacidad,
      ubicacion: form.ubicacion.trim(),
      observaciones: form.observaciones.trim() || null,
    };
    setGuardando(true);
    try {
      if (editando) {
        await pedir(`/mesas/${editando.id}`, { method: 'PUT', body: cuerpo });
        setAviso({ tipo: 'exito', texto: `Se guardaron los cambios de ${cuerpo.etiqueta}.` });
      } else {
        await pedir('/mesas', { method: 'POST', body: cuerpo });
        setAviso({ tipo: 'exito', texto: `Mesa ${cuerpo.etiqueta} creada.` });
      }
      setAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBaja(confirmar) {
    setErrorBaja('');
    try {
      await pedir(`/mesas/${paraBaja.id}/baja`, { method: 'PATCH', body: { confirmar } });
      setAviso({ tipo: 'exito', texto: `${paraBaja.etiqueta} se dio de baja.` });
      setParaBaja(null);
      cargar();
    } catch (err) {
      // Si tiene reservas futuras, el servidor lo avisa y pide confirmar de nuevo.
      setErrorBaja(err.message);
    }
  }

  const columnas = [
    { clave: 'etiqueta', titulo: 'Mesa' },
    { clave: 'capacidad', titulo: 'Capacidad', render: (m) => `${m.capacidad} personas` },
    { clave: 'ubicacion', titulo: 'Ubicación', render: (m) => m.ubicacion ?? '—' },
    { clave: 'observaciones', titulo: 'Observaciones', render: (m) => m.observaciones ?? '—' },
  ];
  if (esAdmin) {
    columnas.push({
      clave: 'acciones',
      titulo: 'Acciones',
      render: (m) => (
        <span className="usuarios-acciones">
          <Boton variante="secundario" aria-label={`Editar ${m.etiqueta}`} onClick={() => abrirEditar(m)}>Editar</Boton>
          <Boton variante="peligro" aria-label={`Dar de baja ${m.etiqueta}`} onClick={() => { setErrorBaja(''); setParaBaja(m); }}>Baja</Boton>
        </span>
      ),
    });
  }

  const activas = (mesas ?? []).filter((m) => m.activo !== false);

  return (
    <>
      <h1>Mesas</h1>
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta>
        {esAdmin && <Boton onClick={abrirNueva}>Nueva mesa</Boton>}
        {mesas === null && !errorLista && <Estado tipo="cargando" />}
        {errorLista && <Estado tipo="error">{errorLista}</Estado>}
        {mesas && <Tabla columnas={columnas} filas={activas} claveFila="id" vacio="Todavía no hay mesas cargadas." />}
      </Tarjeta>

      <Modal abierto={abierto} titulo={editando ? `Editar ${editando.etiqueta}` : 'Nueva mesa'} onCerrar={() => setAbierto(false)}>
        <form onSubmit={guardar} noValidate>
          {errorForm && <Mensaje tipo="error">{errorForm}</Mensaje>}
          <Campo etiqueta="Etiqueta" value={form.etiqueta} onChange={cambiar('etiqueta')} maxLength={30} autoComplete="off" />
          <Campo etiqueta="Capacidad (personas)" type="number" min="1" max="50" step="1" value={form.capacidad} onChange={cambiar('capacidad')} />
          <Campo etiqueta="Ubicación" value={form.ubicacion} onChange={cambiar('ubicacion')} maxLength={30} autoComplete="off" />
          <Campo etiqueta="Observaciones (opcional)" value={form.observaciones} onChange={cambiar('observaciones')} maxLength={200} />
          <div className="modal-acciones">
            <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={guardando} textoCargando="Guardando…">Guardar</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={paraBaja !== null} titulo="Dar de baja la mesa" onCerrar={() => setParaBaja(null)}>
        {errorBaja && <Mensaje tipo="alerta">{errorBaja}</Mensaje>}
        <p>{paraBaja?.etiqueta} dejará de estar disponible para nuevas reservas. ¿Confirmás la baja?</p>
        <div className="modal-acciones">
          <Boton variante="secundario" onClick={() => setParaBaja(null)}>Cancelar</Boton>
          <Boton variante="peligro" onClick={() => confirmarBaja(Boolean(errorBaja))}>
            {errorBaja ? 'Dar de baja igual' : 'Confirmar baja'}
          </Boton>
        </div>
      </Modal>
    </>
  );
}
