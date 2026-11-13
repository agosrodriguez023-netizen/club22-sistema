import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import { dinero } from '../utils/dinero.js';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Modal from '../componentes/Modal.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

// Los cálculos van en centavos (enteros), igual que en el servidor, para evitar errores de decimales.
const aCentavos = (pesos) => Math.round(Number(pesos) * 100);
const aPesos = (centavos) => centavos / 100;

export default function CierreCaja() {
  const [resumen, setResumen] = useState(null); // null = cargando
  const [errorResumen, setErrorResumen] = useState('');
  const [fondo, setFondo] = useState('');
  const [contado, setContado] = useState('');
  const [observacion, setObservacion] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [resultado, setResultado] = useState(null); // el último cierre hecho

  async function cargar() {
    try {
      setResumen(await pedir('/caja/resumen'));
      setErrorResumen('');
    } catch (err) {
      setErrorResumen(err.message);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  // ---- Cálculos en vivo ----
  const hayFondo = fondo !== '';
  const hayContado = contado !== '';
  const efectivoVentasC = resumen ? aCentavos(resumen.efectivo_ventas) : 0;
  const esperadoC = aCentavos(fondo || 0) + efectivoVentasC;   // fondo fijo + ventas en efectivo
  const diferenciaC = aCentavos(contado || 0) - esperadoC;      // contado - esperado
  const hayDiferencia = hayContado && diferenciaC !== 0;
  const sinVentas = resumen !== null && resumen.cantidad_ventas === 0;

  function pedirConfirmacion(e) {
    e.preventDefault();
    setErrorForm('');
    if (!hayFondo || Number(fondo) < 0) return setErrorForm('Ingresá el fondo fijo (0 o más).');
    if (!hayContado || Number(contado) < 0) return setErrorForm('Ingresá el efectivo contado (0 o más).');
    if (hayDiferencia && !observacion.trim()) {
      return setErrorForm('Hay una diferencia: escribí una observación para poder cerrar la caja.');
    }
    setConfirmando(true);
  }

  async function cerrarCaja() {
    setCerrando(true);
    try {
      const respuesta = await pedir('/caja/cierres', {
        method: 'POST',
        body: {
          fondo_fijo: Number(fondo),
          efectivo_contado: Number(contado),
          observacion: observacion.trim() || undefined,
        },
      });
      setResultado(respuesta.cierre);
      setFondo('');
      setContado('');
      setObservacion('');
      setErrorForm('');
      cargar(); // el resumen vuelve a cero
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setCerrando(false);
      setConfirmando(false);
    }
  }

  const columnas = [
    { clave: 'medio', titulo: 'Medio de pago' },
    { clave: 'cantidad', titulo: 'Ventas' },
    { clave: 'total', titulo: 'Total', render: (m) => dinero(Number(m.total)) },
  ];

  return (
    <>
      <h1>Cierre de caja</h1>

      {resultado && (
        <Mensaje tipo={Number(resultado.diferencia) === 0 ? 'exito' : 'alerta'}>
          Caja cerrada ({resultado.cantidad_ventas} ventas, {dinero(Number(resultado.total_ventas))}).{' '}
          {Number(resultado.diferencia) === 0
            ? 'El efectivo coincide: sin diferencia.'
            : `Diferencia de ${dinero(Number(resultado.diferencia))}, registrada con tu observación.`}
        </Mensaje>
      )}

      <div className="cierre">
        <Tarjeta titulo="Ventas sin cerrar">
          {resumen === null && !errorResumen && <Estado tipo="cargando" />}
          {errorResumen && <Estado tipo="error">{errorResumen}</Estado>}
          {resumen && (
            <>
              <Tabla columnas={columnas} filas={resumen.por_medio} claveFila="medio_pago_id" vacio="No hay ventas para cerrar." />
              <dl className="cobro-resumen">
                <div><dt>Cantidad de ventas</dt><dd>{resumen.cantidad_ventas}</dd></div>
                <div className="cobro-total"><dt>Total vendido</dt><dd>{dinero(Number(resumen.total_ventas))}</dd></div>
                <div><dt>De ese total, en efectivo</dt><dd>{dinero(Number(resumen.efectivo_ventas))}</dd></div>
              </dl>
            </>
          )}
        </Tarjeta>

        <Tarjeta titulo="Conteo del efectivo">
          <form onSubmit={pedirConfirmacion} noValidate>
            {errorForm && <Mensaje tipo="error">{errorForm}</Mensaje>}
            <Campo etiqueta="Fondo fijo (lo que había al abrir)" type="number" min="0" value={fondo} onChange={(e) => setFondo(e.target.value)} disabled={sinVentas} />
            <Campo etiqueta="Efectivo contado en la caja" type="number" min="0" value={contado} onChange={(e) => setContado(e.target.value)} disabled={sinVentas} />

            <dl className="cobro-resumen">
              <div><dt>Efectivo esperado</dt><dd>{dinero(aPesos(esperadoC))}</dd></div>
              <div className={`cierre-diferencia ${hayContado ? (diferenciaC === 0 ? 'cierre-ok' : 'cierre-mal') : ''}`}>
                <dt>Diferencia</dt>
                <dd>
                  {hayContado ? dinero(aPesos(diferenciaC)) : '—'}
                  {hayContado && (diferenciaC === 0 ? ' · Coincide' : diferenciaC > 0 ? ' · Sobra' : ' · Falta')}
                </dd>
              </div>
            </dl>

            {hayDiferencia && (
              <Campo
                etiqueta="Observación (obligatoria si hay diferencia)"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                maxLength={300}
                ayuda="Contá qué pasó: un vuelto mal dado, un retiro, etc."
              />
            )}

            {sinVentas && <p className="campo-ayuda">No hay ventas sin cerrar: no hay nada para cerrar.</p>}
            <Boton type="submit" disabled={sinVentas || resumen === null}>Cerrar caja</Boton>
          </form>
        </Tarjeta>
      </div>

      <Modal abierto={confirmando} titulo="¿Cerrar la caja?" onCerrar={() => setConfirmando(false)}>
        {resumen && (
          <p>
            Vas a cerrar {resumen.cantidad_ventas} ventas por {dinero(Number(resumen.total_ventas))}.
            {' '}Efectivo esperado: {dinero(aPesos(esperadoC))}. Contado: {dinero(Number(contado || 0))}.
            {diferenciaC !== 0 && ` Diferencia: ${dinero(aPesos(diferenciaC))}.`} Esto no se puede deshacer.
          </p>
        )}
        <div className="modal-acciones">
          <Boton variante="secundario" onClick={() => setConfirmando(false)}>Volver</Boton>
          <Boton cargando={cerrando} textoCargando="Cerrando…" onClick={cerrarCaja}>Confirmar cierre</Boton>
        </div>
      </Modal>
    </>
  );
}
