import Venta from '../models/venta.model.js';
import { httpError } from '../utils/httpError.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valida lo que llega del navegador. El controlador NO escribe SQL: eso es del modelo.
function validar(body) {
  if (!body || typeof body !== 'object') throw httpError(400, 'Falta el cuerpo de la venta');
  if (!UUID.test(body.uuid_cliente ?? '')) throw httpError(400, 'uuid_cliente inválido');
  if (!['LLEVAR', 'MESA'].includes(body.destino)) throw httpError(400, 'Indicá si es para llevar o para una mesa');
  if (body.destino === 'MESA' && !Number.isInteger(body.mesa_id)) throw httpError(400, 'Elegí la mesa');
  if (!Array.isArray(body.items) || body.items.length === 0) throw httpError(400, 'La venta no tiene productos');
    for (const i of body.items) {
    if (typeof i.codigo !== 'string' || !i.codigo || !Number.isInteger(i.cantidad) || i.cantidad < 1) {
      throw httpError(400, 'Cada producto necesita su código y una cantidad entera mayor a 0');
    }
  }
  if (!Number.isInteger(body.medio_pago_id)) throw httpError(400, 'Elegí el medio de pago');
  const pct = body.descuento_pct ?? 0;
  if (typeof pct !== 'number' || pct < 0 || pct > 100) throw httpError(400, 'El descuento debe estar entre 0 y 100');
  if (body.fecha_hora && Number.isNaN(Date.parse(body.fecha_hora))) throw httpError(400, 'fecha_hora inválida');
}

// Si el mismo producto viene dos veces, se suman las cantidades.
function agruparItems(items) {
  const m = new Map();
  for (const i of items) m.set(i.codigo, (m.get(i.codigo) ?? 0) + i.cantidad);
  return [...m].map(([codigo, cantidad]) => ({ codigo, cantidad }));
}

export async function crear(req, res, next) {
  try {
    validar(req.body);
    const datos = { ...req.body, items: agruparItems(req.body.items) };
    const { id, yaRegistrada } = await Venta.registrar(datos, req.usuario.id);
    const ticket = await Venta.obtener(id);
    res.status(yaRegistrada ? 200 : 201).json({ yaRegistrada, ticket });
  } catch (err) {
    next(err);
  }
}

export async function obtener(req, res, next) {
  try {
    const ticket = await Venta.obtener(Number(req.params.id));
    if (!ticket) throw httpError(404, 'Venta no encontrada');
    res.json(ticket);
  } catch (err) {
    next(err);
  }
}
