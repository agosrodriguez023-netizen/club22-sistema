import Pedido from '../models/pedido.model.js';
import { httpError } from '../utils/httpError.js';

const texto = (x) => typeof x === 'string' && x.trim().length > 0;
const idValido = (valor) => {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1) throw httpError(400, 'Pedido inválido');
  return id;
};

function sinRepetidos(items) {
  const vistos = new Set();
  for (const i of items) {
    if (vistos.has(i.codigo)) throw httpError(400, `El producto ${i.codigo} está repetido`);
    vistos.add(i.codigo);
  }
}

// GET /api/pedidos?estado=PEDIDO&proveedor_id=1
export async function listar(req, res, next) {
  try {
    const { estado, proveedor_id } = req.query;
    if (estado && !['PEDIDO', 'ENTREGADO', 'CANCELADO'].includes(estado)) throw httpError(400, 'Estado inválido');
    res.json(await Pedido.listar({ estado, proveedor_id: proveedor_id ? Number(proveedor_id) : undefined }));
  } catch (err) {
    next(err);
  }
}

export async function obtener(req, res, next) {
  try {
    const pedido = await Pedido.obtener(idValido(req.params.id));
    if (!pedido) throw httpError(404, 'Pedido no encontrado');
    res.json(pedido);
  } catch (err) {
    next(err);
  }
}

// POST /api/pedidos   { proveedor_id, items: [{codigo, cantidad}], observaciones }
export async function crear(req, res, next) {
  try {
    const { proveedor_id, items, observaciones } = req.body ?? {};
    if (!Number.isInteger(proveedor_id)) throw httpError(400, 'Elegí el proveedor');
    if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'El pedido no tiene productos');
    for (const i of items) {
      if (!texto(i?.codigo) || !Number.isInteger(i.cantidad) || i.cantidad < 1) {
        throw httpError(400, 'Cada producto necesita su código y una cantidad entera mayor a 0');
      }
    }
    sinRepetidos(items);
    if (observaciones != null && (typeof observaciones !== 'string' || observaciones.length > 200)) {
      throw httpError(400, 'Las observaciones tienen hasta 200 caracteres');
    }
    const id = await Pedido.crear({ proveedor_id, items, observaciones }, req.usuario.id);
    res.status(201).json(await Pedido.obtener(id));
  } catch (err) {
    next(err);
  }
}

// POST /api/pedidos/:id/ingreso   { numero_remito, items: [{codigo, cantidad_recibida}] }
export async function ingreso(req, res, next) {
  try {
    const id = idValido(req.params.id);
    const { numero_remito, items } = req.body ?? {};
    if (!texto(numero_remito) || numero_remito.trim().length > 30) throw httpError(400, 'El número de remito es obligatorio (hasta 30 caracteres)');
    if (!Array.isArray(items)) throw httpError(400, 'Faltan las cantidades recibidas');
    for (const i of items) {
      if (!texto(i?.codigo) || !Number.isInteger(i.cantidad_recibida) || i.cantidad_recibida < 0) {
        throw httpError(400, 'Cada producto necesita su código y la cantidad recibida (entera, 0 o más)');
      }
    }
    sinRepetidos(items);
    await Pedido.registrarIngreso(id, { numero_remito: numero_remito.trim(), items }, req.usuario.id);
    const pedido = await Pedido.obtener(id);
    res.json({ ...pedido, completo: pedido.items.every((i) => i.diferencia === 0) });
  } catch (err) {
    next(err);
  }
}

// POST /api/pedidos/:id/cancelar
export async function cancelar(req, res, next) {
  try {
    const id = idValido(req.params.id);
    await Pedido.cancelar(id);
    res.json(await Pedido.obtener(id));
  } catch (err) {
    next(err);
  }
}