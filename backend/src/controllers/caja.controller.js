import Cierre from '../models/cierre.model.js';
import { pool } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

// Un importe válido: número finito, no negativo.
const esImporte = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0;

export async function resumen(req, res, next) {
  try {
    res.json(await Cierre.resumenAbierto(pool));
  } catch (err) {
    next(err);
  }
}

export async function cerrar(req, res, next) {
  try {
    const { fondo_fijo, efectivo_contado, observacion } = req.body ?? {};
    if (!esImporte(fondo_fijo)) throw httpError(400, 'El fondo fijo tiene que ser un importe de 0 o más');
    if (!esImporte(efectivo_contado)) throw httpError(400, 'El efectivo contado tiene que ser un importe de 0 o más');
    if (observacion !== undefined && observacion !== null && (typeof observacion !== 'string' || observacion.length > 300)) {
      throw httpError(400, 'La observación puede tener hasta 300 caracteres');
    }
    const cierre = await Cierre.cerrar({ fondo_fijo, efectivo_contado, observacion }, req.usuario.id);
    res.status(201).json({ cierre });
  } catch (err) {
    next(err);
  }
}