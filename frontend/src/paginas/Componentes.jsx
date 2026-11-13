import { useState } from 'react';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Modal from '../componentes/Modal.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

// Página temporal para ver todos los componentes juntos y sacar capturas para el manual de marca.
export default function Componentes() {
  const [abierto, setAbierto] = useState(false);
  const columnas = [
    { clave: 'codigo', titulo: 'Código' },
    { clave: 'nombre', titulo: 'Producto' },
    { clave: 'precio', titulo: 'Precio', render: (f) => `$ ${f.precio.toLocaleString('es-AR')}` },
  ];
  const filas = [
    { id: 1, codigo: 'V-01', nombre: 'Vino Alamos', precio: 8500 },
    { id: 2, codigo: 'V-02', nombre: 'Vino Rutini', precio: 24000 },
  ];

  return (
    <>
      <h1>Componentes</h1>
      <Tarjeta titulo="Botones">
        <p style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Boton>Primario</Boton>
          <Boton variante="secundario">Secundario</Boton>
          <Boton variante="peligro">Peligro</Boton>
          <Boton disabled>Deshabilitado</Boton>
          <Boton cargando textoCargando="Ingresando…">Cargando</Boton>
        </p>
      </Tarjeta>
      <br />
      <Tarjeta titulo="Campos">
        <Campo etiqueta="Normal" ayuda="Texto de ayuda" />
        <Campo etiqueta="Con error" error="Este dato es obligatorio" />
        <Campo etiqueta="Deshabilitado" disabled value="No editable" readOnly />
      </Tarjeta>
      <br />
      <Tarjeta titulo="Mensajes">
        <Mensaje tipo="exito">Venta registrada.</Mensaje>
        <Mensaje tipo="alerta">Stock bajo en Vino Alamos.</Mensaje>
        <Mensaje tipo="error">El monto recibido no alcanza.</Mensaje>
        <Mensaje tipo="info">Recordá hacer el cierre de caja.</Mensaje>
      </Tarjeta>
      <br />
      <Tarjeta titulo="Tabla y estados">
        <Tabla columnas={columnas} filas={filas} />
        <Estado tipo="cargando" />
        <Estado tipo="vacio" />
        <Estado tipo="error" />
      </Tarjeta>
      <br />
      <Tarjeta titulo="Modal">
        <Boton onClick={() => setAbierto(true)}>Abrir ventana</Boton>
        <Modal abierto={abierto} titulo="Ticket de ejemplo" onCerrar={() => setAbierto(false)}>
          <p>Esta ventana se cierra con Esc o con el botón.</p>
          <div className="modal-acciones">
            <Boton variante="secundario" onClick={() => setAbierto(false)}>Cerrar</Boton>
          </div>
        </Modal>
      </Tarjeta>
    </>
  );
}
