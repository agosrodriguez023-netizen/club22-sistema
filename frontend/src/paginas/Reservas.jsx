import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Modal from '../componentes/Modal.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

// Fecha de hoy como AAAA-MM-DD en hora local (no en UTC).
const hoy = () => new Date().toLocaleDateString('en-CA');
const recortar = (hora) => (typeof hora === 'string' ? hora.slice(0, 5) : hora);

// Calendario de reservas (HU-20): se elige el día, se ve lo reservado y se carga una reserva nueva
// buscando primero las mesas libres para esa fecha, hora y cantidad de personas.
export default function Reservas() {
  const [fecha, setFecha] = useState(hoy());
  const [reservas, setReservas] = useState(null); // null = cargando
  const [errorLista, setErrorLista] = useState('');
  const [aviso, setAviso] = useState(null);

  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ fecha: hoy(), hora_inicio: '21:00', hora_fin: '', personas: '2', nombre_cliente: '', contacto: '', observaciones: '' });
  const [libres, setLibres] = useState(null); // null = todavía no buscó
  const [mesaId, setMesaId] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [paraCancelar, setParaCancelar] = useState(null);

  async function cargar() {
    setReservas(null);
    try {
      setReservas(await pedir(`/reservas?fecha=${fecha}`));
      setErrorLista('');
    } catch (err) {
      setErrorLista(err.message);
    }
  }
  useEffect(() => {
    cargar();
  }, [fecha]);

  function abrirNueva() {
    setForm({ fecha, hora_inicio: '21:00', hora_fin: '', personas: '2', nombre_cliente: '', contacto: '', observaciones: '' });
    setLibres(null);
    setMesaId(null);
    setErrorForm('');
    setAbierto(true);
  }

  const cambiar = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value });
    // Si cambia la fecha, la hora o las personas, hay que volver a buscar mesas libres.
    if (['fecha', 'hora_inicio', 'hora_fin', 'personas'].includes(campo)) {
      setLibres(null);
      setMesaId(null);
    }
  };

  async function buscarMesas() {
    setErrorForm('');
    const personas = Number(form.personas);
    if (!form.fecha) return setErrorForm('Elegí la fecha.');
    if (!form.hora_inicio) return setErrorForm('Elegí la hora de inicio.');
    if (!Number.isInteger(personas) || personas < 1 || personas > 50) return setErrorForm('Las personas tienen que ser un número entero entre 1 y 50.');
    setOcupado(true);
    try {
      let ruta = `/reservas/disponibilidad?fecha=${form.fecha}&hora=${form.hora_inicio}&personas=${personas}`;
      if (form.hora_fin) ruta += `&hasta=${form.hora_fin}`;
      setLibres(await pedir(ruta));
      setMesaId(null);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setOcupado(false);
    }
  }

  async function crear(e) {
    e.preventDefault();
    setErrorForm('');
    if (!mesaId) return setErrorForm('Buscá las mesas libres y elegí una.');
    if (!form.nombre_cliente.trim()) return setErrorForm('Ingresá el nombre de quien reserva.');
    if (!form.contacto.trim()) return setErrorForm('Ingresá un teléfono o contacto.');
    setOcupado(true);
    try {
      await pedir('/reservas', {
        method: 'POST',
        body: {
          mesa_id: mesaId,
          fecha: form.fecha,
          hora_inicio: form.hora_inicio,
          hora_fin: form.hora_fin || undefined,
          personas: Number(form.personas),
          nombre_cliente: form.nombre_cliente.trim(),
          contacto: form.contacto.trim(),
          observaciones: form.observaciones.trim() || undefined,
        },
      });
      setAbierto(false);
      setAviso({ tipo: 'exito', texto: 'Reserva creada.' });
      setFecha(form.fecha);
      if (form.fecha === fecha) cargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setOcupado(false);
    }
  }

  async function cancelar() {
    try {
      await pedir(`/reservas/${paraCancelar.id}/cancelar`, { method: 'PATCH' });
      setAviso({ tipo: 'exito', texto: 'Reserva cancelada.' });
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setParaCancelar(null);
    }
  }

  const columnas = [
    { clave: 'hora', titulo: 'Horario', render: (r) => `${recortar(r.hora_inicio)} a ${recortar(r.hora_fin)}` },
    { clave: 'mesa', titulo: 'Mesa', render: (r) => r.etiqueta ?? r.mesa ?? `Mesa ${r.mesa_id}` },
    { clave: 'nombre_cliente', titulo: 'A nombre de' },
    { clave: 'personas', titulo: 'Personas' },
    { clave: 'contacto', titulo: 'Contacto' },
    { clave: 'estado', titulo: 'Estado', render: (r) => (r.estado === 'CANCELADA' ? 'Cancelada' : 'Confirmada') },
    {
      clave: 'cancelar',
      titulo: '',
      render: (r) =>
        r.estado === 'CANCELADA' ? null : (
          <Boton variante="peligro" aria-label={`Cancelar la reserva de ${r.nombre_cliente}`} onClick={() => setParaCancelar(r)}>
            Cancelar
          </Boton>
        ),
    },
  ];

  const listaLibres = Array.isArray(libres) ? libres : libres?.mesas ?? [];

  return (
    <>
      <h1>Reservas</h1>
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta>
        <div className="catalogo-filtros">
          <Campo etiqueta="Día" type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} />
          <Boton variante="secundario" onClick={() => setFecha(hoy())}>Hoy</Boton>
          <Boton onClick={abrirNueva}>Nueva reserva</Boton>
        </div>
        {reservas === null && !errorLista && <Estado tipo="cargando" />}
        {errorLista && <Estado tipo="error">{errorLista}</Estado>}
        {reservas && <Tabla columnas={columnas} filas={reservas} claveFila="id" vacio="No hay reservas para este día." />}
      </Tarjeta>

      <Modal abierto={abierto} titulo="Nueva reserva" onCerrar={() => setAbierto(false)}>
        <form onSubmit={crear} noValidate>
          {errorForm && <Mensaje tipo="error">{errorForm}</Mensaje>}
          <Campo etiqueta="Fecha" type="date" value={form.fecha} onChange={cambiar('fecha')} />
          <Campo etiqueta="Hora de inicio" type="time" value={form.hora_inicio} onChange={cambiar('hora_inicio')} />
          <Campo etiqueta="Hora de fin (opcional)" ayuda="Si no la indicás, se reservan 2 horas." type="time" value={form.hora_fin} onChange={cambiar('hora_fin')} />
          <Campo etiqueta="Personas" type="number" min="1" max="50" step="1" value={form.personas} onChange={cambiar('personas')} />
          <Boton type="button" variante="secundario" onClick={buscarMesas} cargando={ocupado && libres === null} textoCargando="Buscando…">
            Buscar mesas libres
          </Boton>

          {libres !== null && listaLibres.length === 0 && (
            <Mensaje tipo="alerta">No hay mesas libres para ese día, hora y cantidad de personas. Probá con otro horario.</Mensaje>
          )}
          {listaLibres.length > 0 && (
            <fieldset className="cobro-medios">
              <legend>Mesas libres</legend>
              {listaLibres.map((m) => (
                <Boton
                  key={m.id}
                  type="button"
                  variante={m.id === mesaId ? 'primario' : 'secundario'}
                  aria-pressed={m.id === mesaId}
                  onClick={() => setMesaId(m.id)}
                >
                  {m.etiqueta} · {m.capacidad} pers.
                </Boton>
              ))}
            </fieldset>
          )}

          <Campo etiqueta="A nombre de" value={form.nombre_cliente} onChange={cambiar('nombre_cliente')} maxLength={80} autoComplete="off" />
          <Campo etiqueta="Teléfono o contacto" value={form.contacto} onChange={cambiar('contacto')} maxLength={40} autoComplete="off" />
          <Campo etiqueta="Observaciones (opcional)" value={form.observaciones} onChange={cambiar('observaciones')} maxLength={200} />
          <div className="modal-acciones">
            <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={ocupado && libres !== null} textoCargando="Reservando…">Confirmar reserva</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={paraCancelar !== null} titulo="Cancelar la reserva" onCerrar={() => setParaCancelar(null)}>
        <p>Se cancela la reserva de {paraCancelar?.nombre_cliente} y la mesa queda libre. ¿Confirmás?</p>
        <div className="modal-acciones">
          <Boton variante="secundario" onClick={() => setParaCancelar(null)}>Volver</Boton>
          <Boton variante="peligro" onClick={cancelar}>Cancelar reserva</Boton>
        </div>
      </Modal>
    </>
  );
}
