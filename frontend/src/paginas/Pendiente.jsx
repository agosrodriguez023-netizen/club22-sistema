import { useCallback, useEffect, useState } from 'react';
import { ventasPendientes } from '../offline/cola.js';
import { sincronizarCola } from '../offline/sync.js';
import Boton from '../componentes/Boton.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

// Ventas guardadas sin conexión que todavía no llegaron al servidor (T-39).
// Muestra cuántas hay, cuántos intentos de envío hicieron y el último error.
export default function Pendientes() {
  const [ventas, setVentas] = useState(null); // null = cargando
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const cargar = useCallback(() => {
    ventasPendientes()
      .then(setVentas)
      .catch(() => setAviso({ tipo: 'error', texto: 'No pudimos leer las ventas guardadas.' }));
  }, []);

  useEffect(() => {
    cargar();
    // La cola avisa cuando cambia y cuando termina un envío.
    window.addEventListener('club22:cola-cambio', cargar);
    window.addEventListener('club22:sync-fin', cargar);
    return () => {
      window.removeEventListener('club22:cola-cambio', cargar);
      window.removeEventListener('club22:sync-fin', cargar);
    };
  }, [cargar]);

  async function enviarAhora() {
    setEnviando(true);
    setAviso(null);
    try {
      await sincronizarCola();
      setAviso({ tipo: 'exito', texto: 'Terminó el envío. Revisá si quedó algo con error.' });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message || 'No se pudo enviar.' });
    } finally {
      setEnviando(false);
      cargar();
    }
  }

  // Cada elemento de la cola es { uuid_cliente, venta, creada, intentos, ultimo_error }.
  const datosDe = (v) => v.venta || {};
  const cantidadItems = (v) => (datosDe(v).items || []).reduce((s, i) => s + Number(i.cantidad || 0), 0);

  const columnas = [
    {
      clave: 'fecha',
      titulo: 'Guardada',
      render: (v) => (v.creada ? new Date(v.creada).toLocaleString('es-AR') : '—'),
    },
    { clave: 'destino', titulo: 'Destino', render: (v) => (datosDe(v).destino === 'MESA' ? 'Mesa' : 'Para llevar') },
    { clave: 'items', titulo: 'Productos', render: (v) => cantidadItems(v) },
    { clave: 'intentos', titulo: 'Intentos', render: (v) => v.intentos ?? 0 },
    {
      clave: 'estado',
      titulo: 'Estado',
      render: (v) => (v.ultimo_error ? `Con error: ${v.ultimo_error}` : 'Esperando para enviarse'),
    },
  ];

  return (
    <>
      <h1>Ventas pendientes</h1>
      <p>Son las ventas que se hicieron sin conexión y todavía no llegaron al servidor. Se envían solas cuando vuelve internet.</p>

      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta titulo={`Pendientes (${ventas ? ventas.length : 0})`}>
        <Tabla
          columnas={columnas}
          filas={ventas || []}
          claveFila="uuid_cliente"
          vacio="No hay ventas pendientes. Todo está enviado."
        />
        <Boton onClick={enviarAhora} disabled={!ventas || ventas.length === 0} cargando={enviando} textoCargando="Enviando…">
          Enviar ahora
        </Boton>
      </Tarjeta>
    </>
  );
}