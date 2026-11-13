import { useEffect, useState } from 'react';
import { cantidadPendientes } from '../offline/cola.js';
import { sincronizarCola, iniciarSincronizacion } from '../offline/sync.js';
 
// Cartelito para la cabecera: dice si hay conexión y cuántas ventas esperan enviarse.
export default function IndicadorSync() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [pendientes, setPendientes] = useState(0);
 
  useEffect(() => {
    const actualizar = () => cantidadPendientes().then(setPendientes).catch(() => {});
    const conectado = () => setEnLinea(true);
    const desconectado = () => setEnLinea(false);
 
    actualizar();
    const detener = iniciarSincronizacion();
    window.addEventListener('online', conectado);
    window.addEventListener('offline', desconectado);
    window.addEventListener('club22:cola-cambio', actualizar);
    window.addEventListener('club22:sync-fin', actualizar);
    return () => {
      detener();
      window.removeEventListener('online', conectado);
      window.removeEventListener('offline', desconectado);
      window.removeEventListener('club22:cola-cambio', actualizar);
      window.removeEventListener('club22:sync-fin', actualizar);
    };
  }, []);
 
  const texto = !enLinea
    ? `Sin conexión${pendientes ? ` · ${pendientes} venta${pendientes === 1 ? '' : 's'} para enviar` : ''}`
    : pendientes
      ? `${pendientes} venta${pendientes === 1 ? '' : 's'} por enviar`
      : 'Conectado';
  const tipo = !enLinea ? 'alerta' : pendientes ? 'info' : 'exito';
 
  return (
    <span className={`mensaje mensaje-${tipo}`} role="status" style={{ padding: '0.25rem 0.75rem' }}>
      {texto}
      {enLinea && pendientes > 0 && (
        <button className="boton boton-secundario" style={{ marginLeft: '0.5rem' }} onClick={() => sincronizarCola()}>
          Enviar ahora
        </button>
      )}
    </span>
  );
}
 