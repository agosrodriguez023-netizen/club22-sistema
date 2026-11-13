import { dinero } from '../utils/dinero.js';
import Boton from './Boton.jsx';
import Modal from './Modal.jsx';

// Ticket de la venta en una ventana. "ticket" es lo que devuelve la API al registrar la venta
// (los importes llegan como texto, por eso se pasan con Number).
export default function Ticket({ ticket, onCerrar }) {
  return (
    <Modal abierto={ticket !== null} titulo={ticket ? `Ticket N° ${ticket.numero_ticket}` : 'Ticket'} onCerrar={onCerrar}>
      {ticket && (
        <>
          <div className="ticket">
            <p className="ticket-marca">Club 22</p>
            <p className="ticket-centro">Ticket N° {ticket.numero_ticket}</p>
            <p className="ticket-centro">{new Date(ticket.fecha_hora).toLocaleString('es-AR')}</p>
            <p>
              Atendió: {ticket.atendido_por}
              <br />
              {ticket.destino === 'MESA' ? `Mesa: ${ticket.mesa ?? ''}` : 'Para llevar'}
            </p>

            <table className="ticket-tabla">
              <thead>
                <tr><th scope="col">Producto</th><th scope="col">Cant.</th><th scope="col">Importe</th></tr>
              </thead>
              <tbody>
                {ticket.items.map((i) => (
                  <tr key={i.codigo}>
                    <td>{i.nombre}</td>
                    <td>{i.cantidad}</td>
                    <td>{dinero(Number(i.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="ticket-totales">
              <div><dt>Subtotal</dt><dd>{dinero(Number(ticket.subtotal))}</dd></div>
              {Number(ticket.descuento_total) > 0 && (
                <div><dt>Descuento ({Number(ticket.descuento_manual_pct)}%)</dt><dd>− {dinero(Number(ticket.descuento_total))}</dd></div>
              )}
              <div className="ticket-total"><dt>TOTAL</dt><dd>{dinero(Number(ticket.total))}</dd></div>
              <div><dt>Medio de pago</dt><dd>{ticket.medio_pago}</dd></div>
              {ticket.monto_recibido !== null && (
                <>
                  <div><dt>Recibido</dt><dd>{dinero(Number(ticket.monto_recibido))}</dd></div>
                  <div><dt>Vuelto</dt><dd>{dinero(Number(ticket.vuelto))}</dd></div>
                </>
              )}
            </dl>

            <p className="ticket-leyenda">{ticket.leyenda}</p>
          </div>

          <div className="modal-acciones">
            <Boton variante="secundario" onClick={() => window.print()}>Imprimir</Boton>
            <Boton onClick={onCerrar}>Nueva venta</Boton>
          </div>
        </>
      )}
    </Modal>
  );
}
