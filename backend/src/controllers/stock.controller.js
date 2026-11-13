import Stock from '../models/stock.model.js';
import { httpError } from '../utils/httpError.js';

const entero = (x) => Number.isInteger(x);
const texto = (x) => typeof x === 'string' && x.trim().length > 0;

function validarMotivo(motivo) {
  if (!texto(motivo) || motivo.trim().length < 3 || motivo.trim().length > 200) {
    throw httpError(400, 'El motivo es obligatorio (entre 3 y 200 caracteres)');
  }
}

// GET /api/stock            -> todos los productos con stock
// GET /api/stock?alertas=1  -> solo los que llegaron al mínimo
export async function listar(req, res, next) {
  try {
    res.json(await Stock.listar({ soloAlertas: req.query.alertas === '1' }));
  } catch (err) {
    next(err);
  }
}

// GET /api/stock/:codigo/movimientos?limite=50
export async function movimientos(req, res, next) {
  try {
    const limite = Math.min(Number(req.query.limite) || 50, 500);
    res.json(await Stock.movimientos(req.params.codigo, limite));
  } catch (err) {
    next(err);
  }
}

// PUT /api/stock/:codigo/minimo   { stock_minimo }
export async function cambiarMinimo(req, res, next) {
  try {
    const { stock_minimo } = req.body ?? {};
    if (!entero(stock_minimo) || stock_minimo < 0) throw httpError(400, 'El stock mínimo tiene que ser un número entero, 0 o más');
    res.json(await Stock.cambiarMinimo(req.params.codigo, stock_minimo, req.usuario.id));
  } catch (err) {
    next(err);
  }
}

// POST /api/stock/:codigo/ajuste   { stock_nuevo, motivo }
export async function ajustar(req, res, next) {
  try {
    const { stock_nuevo, motivo } = req.body ?? {};
    if (!entero(stock_nuevo) || stock_nuevo < 0) throw httpError(400, 'El stock nuevo tiene que ser un número entero, 0 o más');
    validarMotivo(motivo);
    res.json(await Stock.ajustar(req.params.codigo, { stock_nuevo, motivo: motivo.trim() }, req.usuario.id));
  } catch (err) {
    next(err);
  }
}

// POST /api/stock/conteo   { items: [{codigo, contado}], aplicar: true|false, motivo }
export async function conteo(req, res, next) {
  try {
    const { items, aplicar = false, motivo } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'El conteo no tiene productos');
    if (items.length > 500) throw httpError(400, 'Se pueden contar hasta 500 productos por vez');
    if (typeof aplicar !== 'boolean') throw httpError(400, '"aplicar" tiene que ser verdadero o falso');
    const vistos = new Set();
    for (const i of items) {
      if (!texto(i?.codigo) || !entero(i.contado) || i.contado < 0) {
        throw httpError(400, 'Cada producto necesita su código y la cantidad contada (número entero, 0 o más)');
      }
      if (vistos.has(i.codigo)) throw httpError(400, `El producto ${i.codigo} está repetido en el conteo`);
      vistos.add(i.codigo);
    }
    if (aplicar) validarMotivo(motivo);
    res.json(await Stock.conteo(items, { aplicar, motivo: aplicar ? motivo.trim() : null }, req.usuario.id));
  } catch (err) {
    next(err);
  }
}