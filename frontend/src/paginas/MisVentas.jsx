import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import { useAuth } from '../context/AuthContext.jsx';
import { dinero } from '../utils/dinero.js';
import Boton from '../componentes/Boton.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';
import Ticket from '../componentes/Ticket.jsx';

// Desde las 00:00 de hoy (hora de la computadora) hasta las 00:00 de mañana.
function rangoDeHoy() {
  const desde = new Date();
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + 1);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

export default function MisVentas() {
  const { usuario } = useAuth();
  const [ventas, setVentas] = useState(null); // null = cargando
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [abriendo, setAbriendo] = useState(null); // id de la venta que se está abriendo

  async function cargar() {
    const { desde, hasta } = rangoDeHoy();
    try {
      setVentas(await pedir(`/ventas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  async function verTicket(id) {
    setAbriendo(id);
    try {
      setTicket(await pedir(`/ventas/${id}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setAbriendo(null);
    }
  }

  const confirmadas = (ventas ?? []).filter((v) => v.estado === 'CONFIRMADA');
  const total = confirmadas.reduce((suma, v) => suma + Math.round(Number(v.total) * 100), 0) / 100;

  const columnas = [
    { clave: 'numero_ticket', titulo: 'Ticket N°' },
    { clave: 'fecha_hora', titulo: 'Hora', render: (v) => new Date(v.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) },
    { clave: 'destino', titulo: 'Destino', render: (v) => (v.destino === 'MESA' ? 'Mesa' : 'Para llevar') },
    { clave: 'medio_pago', titulo: 'Medio de pago' },
    { clave: 'total', titulo: 'Total', render: (v) => dinero(Number(v.total)) },
    { clave: 'atendido_por', titulo: 'Atendió' },
    { clave: 'estado', titulo: 'Estado', render: (v) => (v.estado === 'CONFIRMADA' ? 'Confirmada' : 'Anulada') },
    {
      clave: 'ver',
      titulo: '',
      render: (v) => (
        <Boton variante="secundario" cargando={abriendo === v.id} textoCargando="Abriendo…" onClick={() => verTicket(v.id)}>
          Ver ticket
        </Boton>
      ),
    },
  ];

  return (
    <>
      <h1>Mis ventas del día</h1>
      <Tarjeta>
        <p>
          {usuario.rol === 'ADMINISTRADOR'
            ? 'Todas las ventas de hoy.'
            : 'Las ventas que registraste hoy.'}{' '}
          Tocá “Ver ticket” para volver a ver o imprimir un ticket anterior.
        </p>
        {error && <Mensaje tipo="error">{error}</Mensaje>}
        {ventas === null && !error && <Estado tipo="cargando" />}
        {ventas && (
          <>
            <Tabla columnas={columnas} filas={ventas} claveFila="id" vacio="Todavía no hay ventas hoy." />
            <p className="venta-total">
              {confirmadas.length} ventas · Total: <strong>{dinero(total)}</strong>
            </p>
          </>
        )}
      </Tarjeta>
      <Ticket ticket={ticket} onCerrar={() => setTicket(null)} />
    </>
  );
}
