import Proveedor from '../models/proveedor.model.js';
import { httpError } from '../utils/httpError.js';

const texto = (x) => typeof x === 'string' && x.trim().length > 0;

function validar(c, { completo }) {
  if (c.nombre !== undefined || completo) {
    if (!texto(c.nombre) || c.nombre.trim().length > 100) throw httpError(400, 'El nombre es obligatorio (hasta 100 caracteres)');
  }
  if (c.cuit != null && (typeof c.cuit !== 'string' || c.cuit.length > 13)) throw httpError(400, 'El CUIT tiene hasta 13 caracteres');
  if (c.telefono != null && (typeof c.telefono !== 'string' || c.telefono.length > 30)) throw httpError(400, 'El teléfono tiene hasta 30 caracteres');
  if (c.email != null && (typeof c.email !== 'string' || c.email.length > 100 || !/^\S+@\S+\.\S+$/.test(c.email))) {
    throw httpError(400, 'El email no es válido');
  }
  if (c.activo !== undefined && typeof c.activo !== 'boolean') throw httpError(400, '"activo" tiene que ser verdadero o falso');
}

export async function listar(req, res, next) {
  try {
    res.json(await Proveedor.listar({ incluirInactivos: req.query.todos === '1' }));
  } catch (err) {
    next(err);
  }
}

export async function crear(req, res, next) {
  try {
    const c = req.body ?? {};
    validar(c, { completo: true });
    res.status(201).json(await Proveedor.crear(c));
  } catch (err) {
    next(err);
  }
}

export async function editar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw httpError(400, 'Proveedor inválido');
    const { nombre, cuit, telefono, email, activo } = req.body ?? {};
    const cambios = { nombre, cuit, telefono, email, activo };
    validar(cambios, { completo: false });
    res.json(await Proveedor.editar(id, cambios));
  } catch (err) {
    next(err);
  }
}