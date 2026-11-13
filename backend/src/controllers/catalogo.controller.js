import Catalogo from '../models/catalogo.model.js';

export async function listar(req, res, next) {
  try {
    res.json(await Catalogo.listar());
  } catch (err) {
    next(err);
  }
}