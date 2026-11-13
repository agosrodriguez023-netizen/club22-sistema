import { useEffect, useRef, useState } from 'react';
import { pedir } from '../api/cliente.js';
import { aCentavos, aPesos, dinero } from '../utils/dinero.js';
import Boton from './Boton.jsx';
import Campo from './Campo.jsx';
import Estado from './Estado.jsx';
import Mensaje from './Mensaje.jsx';
import Tarjeta from './Tarjeta.jsx';

/**
 * Cobro de la venta: medio de pago, descuento manual, monto recibido y vuelto.
 * Props:
 *  - items: [{ codigo, cantidad, ... }]
 *  - destino: 'LLEVAR' | 'MESA'
 *  - mesa: texto con el número de mesa (solo si destino es MESA)
 *  - subtotal: suma de la venta en pesos (la calcula la pantalla de Venta)
 *  - alRegistrar(ticket): se llama cuando la API confirma la venta
 */
export default function PanelCobro({ items, destino, mesa, subtotal, alRegistrar }) {
  const [medios, setMedios] = useState(null);      // null = cargando
  const [errorMedios, setErrorMedios] = useState('');
  const [medioId, setMedioId] = useState(null);
  const [descuento, setDescuento] = useState('');  // % escrito por la persona
  const [recibido, setRecibido] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  // Un identificador por venta: si se reintenta el envío, la API ve el mismo y no la duplica.
  const uuidRef = useRef(crypto.randomUUID());

  useEffect(() => {
    pedir('/medios-pago')
      .then(setMedios)
      .catch((err) => setErrorMedios(err.message));
  }, []);

  // ---- Cálculos (en centavos, igual que el servidor) ----
  const pct = descuento === '' ? 0 : Number(descuento);
  const pctValido = Number.isFinite(pct) && pct >= 0 && pct <= 100;
  const subtotalC = aCentavos(subtotal);
  const descuentoC = pctValido ? Math.round((subtotalC * pct) / 100) : 0;
  const totalC = subtotalC - descuentoC;

  const medio = medios?.find((m) => m.id === medioId);
  const esEfectivo = Boolean(medio?.es_efectivo);
  const recibidoC = recibido === '' ? null : aCentavos(recibido);
  const vueltoC = esEfectivo && recibidoC !== null ? recibidoC - totalC : null;

  // ---- Validaciones (T-10): lo que falta para poder confirmar ----
  const errorDescuento = !pctValido ? 'El descuento tiene que estar entre 0 y 100.' : '';
  const errorRecibido =
    esEfectivo && recibidoC !== null && recibidoC < totalC
      ? `Falta ${dinero(aPesos(totalC - recibidoC))} para cubrir el total.`
      : '';
  const faltantes = [];
  if (items.length === 0) faltantes.push('agregar productos');
  if (destino === 'MESA' && !(Number.isInteger(Number(mesa)) && Number(mesa) >= 1)) faltantes.push('indicar el número de mesa');
  if (medioId === null) faltantes.push('elegir el medio de pago');
  if (errorDescuento) faltantes.push('corregir el descuento');
  if (esEfectivo && (recibidoC === null || recibidoC < totalC)) faltantes.push('ingresar el monto recibido');
  const puedeConfirmar = faltantes.length === 0 && !enviando;

  async function confirmar(e) {
    e.preventDefault();
    if (!puedeConfirmar) return;
    setEnviando(true);
    setErrorEnvio('');
    try {
      const respuesta = await pedir('/ventas', {
        method: 'POST',
        body: {
          uuid_cliente: uuidRef.current,
          destino,
          mesa_id: destino === 'MESA' ? Number(mesa) : undefined,
          items: items.map((i) => ({ codigo: i.codigo, cantidad: i.cantidad })),
          medio_pago_id: medioId,
          descuento_pct: pct,
          monto_recibido: esEfectivo ? Number(recibido) : undefined,
        },
      });
      uuidRef.current = crypto.randomUUID(); // la próxima venta lleva otro identificador
      setMedioId(null);
      setDescuento('');
      setRecibido('');
      alRegistrar(respuesta.ticket);
    } catch (err) {
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tarjeta titulo="Cobro">
      {medios === null && !errorMedios && <Estado tipo="cargando" />}
      {errorMedios && <Mensaje tipo="error">No pudimos cargar los medios de pago: {errorMedios}</Mensaje>}

      <form onSubmit={confirmar} noValidate>
        {medios && (
          <fieldset className="cobro-medios">
            <legend>Medio de pago</legend>
            {medios.map((m) => (
              <Boton
                key={m.id}
                type="button"
                variante={m.id === medioId ? 'primario' : 'secundario'}
                aria-pressed={m.id === medioId}
                onClick={() => setMedioId(m.id)}
              >
                {m.nombre}
              </Boton>
            ))}
          </fieldset>
        )}

        <Campo
          etiqueta="Descuento manual (%)"
          type="number"
          min="0"
          max="100"
          value={descuento}
          onChange={(e) => setDescuento(e.target.value)}
          error={errorDescuento}
        />

        <dl className="cobro-resumen">
          <div><dt>Subtotal</dt><dd>{dinero(subtotal)}</dd></div>
          {descuentoC > 0 && <div><dt>Descuento ({pct}%)</dt><dd>− {dinero(aPesos(descuentoC))}</dd></div>}
          <div className="cobro-total"><dt>Total a cobrar</dt><dd>{dinero(aPesos(totalC))}</dd></div>
        </dl>

        {esEfectivo && (
          <>
            <Campo
              etiqueta="Monto recibido"
              type="number"
              min="0"
              value={recibido}
              onChange={(e) => setRecibido(e.target.value)}
              error={errorRecibido}
            />
            <Boton type="button" variante="secundario" onClick={() => setRecibido(String(aPesos(totalC)))}>
              Monto justo
            </Boton>
            {vueltoC !== null && vueltoC >= 0 && (
              <p className="cobro-vuelto">Vuelto: <strong>{dinero(aPesos(vueltoC))}</strong></p>
            )}
          </>
        )}

        {errorEnvio && <Mensaje tipo="error">{errorEnvio}</Mensaje>}
        {faltantes.length > 0 && <p className="campo-ayuda">Para confirmar falta: {faltantes.join(', ')}.</p>}

        <Boton type="submit" disabled={!puedeConfirmar} cargando={enviando} textoCargando="Registrando…">
          Confirmar venta
        </Boton>
      </form>
    </Tarjeta>
  );
}
