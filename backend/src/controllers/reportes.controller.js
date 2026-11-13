import Reporte from '../models/reporte.model.js';
import { httpError } from '../utils/httpError.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const DIA_MS = 24 * 60 * 60 * 1000;

/** Lee y valida ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD (máximo un año). */
function periodo(query) {
  const { desde, hasta } = query;
  for (const f of [desde, hasta]) {
    if (typeof f !== 'string' || !FECHA.test(f) || Number.isNaN(Date.parse(f))) {
      throw httpError(400, 'Indicá desde y hasta con el formato AAAA-MM-DD');
    }
  }
  if (hasta < desde) throw httpError(400, 'La fecha "hasta" no puede ser anterior a "desde"');
  if ((Date.parse(hasta) - Date.parse(desde)) / DIA_MS > 366) throw httpError(400, 'El período puede ser de hasta un año');
  return { desde, hasta };
}

export async function ventas(req, res, next) {
  try {
    const { desde, hasta } = periodo(req.query);
    res.json(await Reporte.ventas(desde, hasta));
  } catch (err) {
    next(err);
  }
}

export async function masVendidos(req, res, next) {
  try {
    const { desde, hasta } = periodo(req.query);
    const limite = req.query.limite === undefined ? 10 : Number(req.query.limite);
    if (!Number.isInteger(limite) || limite < 1 || limite > 100) throw httpError(400, 'El límite tiene que ser un número entre 1 y 100');
    const orden = req.query.orden ?? 'unidades';
    if (!['unidades', 'importe'].includes(orden)) throw httpError(400, 'El orden tiene que ser unidades o importe');
    res.json(await Reporte.masVendidos(desde, hasta, { limite, orden }));
  } catch (err) {
    next(err);
  }
}

export async function cierres(req, res, next) {
  try {
    const { desde, hasta } = periodo(req.query);
    res.json(await Reporte.cierres(desde, hasta, { conDiferencia: req.query.con_diferencia === 'true' }));
  } catch (err) {
    next(err);
  }
}

// Excel en español separa con punto y coma y necesita la marca UTF-8 para ver bien las tildes.
const COLUMNAS = [
  ['fecha_hora', 'Fecha y hora'], ['ticket', 'Ticket'], ['destino', 'Destino'], ['mesa', 'Mesa'],
  ['medio_pago', 'Medio de pago'], ['subtotal', 'Subtotal'], ['descuento_total', 'Descuento'],
  ['promocion', 'Promoción'], ['descuento_manual_pct', 'Descuento manual %'], ['total', 'Total'],
  ['origen', 'Origen'], ['atendido_por', 'Atendido por'],
];

function celda(valor) {
  if (valor === null || valor === undefined) return '';
  let s = String(valor);
  if (/^[=+\-@]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`; // evita que Excel lo tome como fórmula
  return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export async function ventasCsv(req, res, next) {
  try {
    const { desde, hasta } = periodo(req.query);
    const filas = await Reporte.ventasDetalle(desde, hasta);
    const lineas = [COLUMNAS.map(([, titulo]) => titulo).join(';')];
    for (const f of filas) lineas.push(COLUMNAS.map(([campo]) => celda(f[campo])).join(';'));
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="ventas-${desde}-a-${hasta}.csv"`);
    res.send('﻿' + lineas.join('\r\n') + '\r\n');
  } catch (err) {
    next(err);
  }
}