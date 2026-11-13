import { transaccion } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

// Los importes se calculan en CENTAVOS (enteros) para evitar errores de decimales.
const aCentavos = (pesos) => Math.round(Number(pesos) * 100);
const aPesos = (centavos) => (centavos / 100).toFixed(2);

// Ventas confirmadas que todavía no entraron en ningún cierre.
// Con bloquear=true quedan bloqueadas hasta terminar la transacción (así dos cierres a la vez no las cuentan dos veces).
async function ventasAbiertas(db, bloquear = false) {
  const { rows } = await db.query(
    `SELECT v.id, v.total, v.medio_pago_id, mp.nombre AS medio, mp.es_efectivo
       FROM venta v JOIN medio_de_pago mp ON mp.id = v.medio_pago_id
      WHERE v.cierre_id IS NULL AND v.estado = 'CONFIRMADA'
      ORDER BY v.id ${bloquear ? 'FOR UPDATE OF v' : ''}`
  );
  return rows;
}

// Suma las ventas: total general, efectivo y desglose por medio de pago.
function sumar(ventas) {
  const porMedio = new Map();
  let totalC = 0;
  let efectivoC = 0;
  for (const v of ventas) {
    const c = aCentavos(v.total);
    totalC += c;
    if (v.es_efectivo) efectivoC += c;
    const m = porMedio.get(v.medio_pago_id) ?? { medio_pago_id: v.medio_pago_id, medio: v.medio, totalC: 0, cantidad: 0 };
    m.totalC += c;
    m.cantidad += 1;
    porMedio.set(v.medio_pago_id, m);
  }
  return { totalC, efectivoC, cantidad: ventas.length, porMedio: [...porMedio.values()] };
}

const formatearMedios = (porMedio) =>
  porMedio.map((m) => ({ medio_pago_id: m.medio_pago_id, medio: m.medio, cantidad: m.cantidad, total: aPesos(m.totalC) }));

const Cierre = {
  /** Vista previa del cierre: lo que hay sin cerrar, por medio de pago. No modifica nada. */
  async resumenAbierto(db) {
    const s = sumar(await ventasAbiertas(db));
    return {
      cantidad_ventas: s.cantidad,
      total_ventas: aPesos(s.totalC),
      efectivo_ventas: aPesos(s.efectivoC),
      por_medio: formatearMedios(s.porMedio),
    };
  },

  /**
   * Cierra la caja en UNA transacción: guarda el cierre, sus totales por medio,
   * marca las ventas con el cierre_id y deja el registro de auditoría.
   * datos: { fondo_fijo, efectivo_contado, observacion? }
   */
  async cerrar(datos, usuarioId) {
    return transaccion(async (client) => {
      const ventas = await ventasAbiertas(client, true);
      if (ventas.length === 0) throw httpError(400, 'No hay ventas para cerrar');
      const s = sumar(ventas);

      const fondoC = aCentavos(datos.fondo_fijo);
      const contadoC = aCentavos(datos.efectivo_contado);
      const esperadoC = fondoC + s.efectivoC;       // fondo fijo + ventas en efectivo
      const diferenciaC = contadoC - esperadoC;     // contado - esperado
      const observacion = datos.observacion?.trim() || null;

      // RN-02: si hay diferencia, la observación es obligatoria
      if (diferenciaC !== 0 && !observacion) {
        throw httpError(400, `Hay una diferencia de $ ${aPesos(diferenciaC)}: escribí una observación para poder cerrar`);
      }

      const { rows } = await client.query(
        `INSERT INTO cierre_de_caja (usuario_id, fondo_fijo, efectivo_esperado, efectivo_contado,
                                     diferencia, total_ventas, cantidad_ventas, observacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, fecha_hora`,
        [usuarioId, aPesos(fondoC), aPesos(esperadoC), aPesos(contadoC), aPesos(diferenciaC),
         aPesos(s.totalC), s.cantidad, observacion]
      );
      const cierreId = rows[0].id;

      for (const m of s.porMedio) {
        await client.query(
          'INSERT INTO cierre_total_medio (cierre_id, medio_pago_id, total) VALUES ($1, $2, $3)',
          [cierreId, m.medio_pago_id, aPesos(m.totalC)]
        );
      }

      await client.query('UPDATE venta SET cierre_id = $1 WHERE id = ANY($2)', [cierreId, ventas.map((v) => v.id)]);

      const resultado = {
        id: cierreId,
        fecha_hora: rows[0].fecha_hora,
        fondo_fijo: aPesos(fondoC),
        efectivo_esperado: aPesos(esperadoC),
        efectivo_contado: aPesos(contadoC),
        diferencia: aPesos(diferenciaC),
        total_ventas: aPesos(s.totalC),
        cantidad_ventas: s.cantidad,
        observacion,
        por_medio: formatearMedios(s.porMedio),
      };

      await client.query(
        `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, despues)
         VALUES ($1, 'CIERRE_CAJA', 'cierre_de_caja', $2, $3)`,
        [usuarioId, cierreId, JSON.stringify(resultado)]
      );

      return resultado;
    });
  },
};

export default Cierre;