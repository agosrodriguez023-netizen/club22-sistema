import MedioPago from '../models/medioPago.model.js';

export async function listar(req, res, next) {
  try {
    res.json(await MedioPago.listar());
  } catch (err) {
    next(err);
  }
}