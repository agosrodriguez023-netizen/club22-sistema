import Mesa from '../models/mesa.model.js';
import { httpError } from '../utils/httpError.js';

const texto = (x) => typeof x === 'string' && x.trim().length > 0;

function idValido(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1) throw httpError(400, 'Mesa inválida');
  return id;
}

function validar(c, { completo }) {
  if (c.etiqueta !== undefined || completo) {
    if (!texto(c.etiqueta) || c.etiqueta.trim().length > 30) throw httpError(400, 'La etiqueta es obligatoria (hasta 30 caracteres)');
  }
  if (c.capacidad !== undefined || completo) {
    if (!Number.isInteger(c.capacidad) || c.capacidad < 1 || c.capacidad > 50) throw httpError(400, 'La capacidad tiene que ser un número entero entre 1 y 50');
  }
  if (c.ubicacion !== undefined || completo) {
    if (!texto(c.ubicacion) || c.ubicacion.trim().length > 30) throw httpError(400, 'La ubicación es obligatoria (hasta 30 caracteres)');
  }
  if (c.observaciones != null && (typeof c.observaciones !== 'string' || c.observaciones.length > 200)) {
    throw httpError(400, 'Las observaciones tienen hasta 200 caracteres');
  }
}

export async function listar(req, res, next) {
  try {
    res.json(await Mesa.listar());
  } catch (err) {
    next(err);
  }
}

export async function obtener(req, res, next) {
  try {
    const mesa = await Mesa.obtener(idValido(req.params.id));
    if (!mesa || !mesa.activo) throw httpError(404, 'Mesa no encontrada');
    res.json(mesa);
  } catch (err) {
    next(err);
  }
}

export async function crear(req, res, next) {
  try {
    const c = req.body ?? {};
    validar(c, { completo: true });
    res.status(201).json(await Mesa.crear(c));
  } catch (err) {
    next(err);
  }
}

export async function editar(req, res, next) {
  try {
    const id = idValido(req.params.id);
    const { etiqueta, capacidad, ubicacion, observaciones } = req.body ?? {};
    const cambios = { etiqueta, capacidad, ubicacion, observaciones };
    validar(cambios, { completo: false });
    res.json(await Mesa.editar(id, cambios));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/mesas/:id/baja   { confirmar: true }  (confirmar solo hace falta si tiene reservas futuras)
export async function baja(req, res, next) {
  try {
    await Mesa.darDeBaja(idValido(req.params.id), { confirmar: req.body?.confirmar === true });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function ocupar(req, res, next) {
  try {
    res.json(await Mesa.ocupar(idValido(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function liberar(req, res, next) {
  try {
    res.json(await Mesa.liberar(idValido(req.params.id)));
  } catch (err) {
    next(err);
  }
}