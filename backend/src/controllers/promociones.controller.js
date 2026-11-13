import Promocion from '../models/promocion.model.js';
import { httpError } from '../utils/httpError.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const texto = (x) => typeof x === 'string' && x.trim().length > 0;
const fechaOk = (x) => typeof x === 'string' && FECHA.test(x) && !Number.isNaN(Date.parse(x));

function idValido(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1) throw httpError(400, 'Promoción inválida');
  return id;
}

/** Toma solo los campos conocidos de lo que llega. */
function campos(b) {
  const { nombre, tipo, porcentaje, categoria, producto_codigo, fecha_desde, fecha_hasta, dias_semana, hora_desde, hora_hasta, activo } = b ?? {};
  return { nombre, tipo, porcentaje, categoria, producto_codigo, fecha_desde, fecha_hasta, dias_semana, hora_desde, hora_hasta, activo };
}

/** Valida la promoción completa. */
function validar(c) {
  if (!texto(c.nombre) || c.nombre.trim().length > 80) throw httpError(400, 'El nombre es obligatorio (hasta 80 caracteres)');
  if (!['PORCENTAJE', 'HAPPY_HOUR'].includes(c.tipo)) throw httpError(400, 'El tipo tiene que ser PORCENTAJE o HAPPY_HOUR');
  if (typeof c.porcentaje !== 'number' || !(c.porcentaje > 0) || c.porcentaje > 100) throw httpError(400, 'El porcentaje tiene que ser mayor a 0 y hasta 100');
  if (c.categoria && c.producto_codigo) throw httpError(400, 'Elegí una categoría o un producto, no los dos');
  if (c.categoria != null && (typeof c.categoria !== 'string' || c.categoria.length > 40)) throw httpError(400, 'La categoría tiene hasta 40 caracteres');
  if (!fechaOk(c.fecha_desde) || !fechaOk(c.fecha_hasta)) throw httpError(400, 'Las fechas tienen que tener el formato AAAA-MM-DD');
  if (c.fecha_hasta < c.fecha_desde) throw httpError(400, 'La fecha de fin no puede ser anterior a la de inicio');
  if (!Array.isArray(c.dias_semana) || c.dias_semana.length === 0 || !c.dias_semana.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
    throw httpError(400, 'Los días tienen que ser números de 0 (domingo) a 6 (sábado)');
  }
  const hayDesde = c.hora_desde != null, hayHasta = c.hora_hasta != null;
  if (hayDesde !== hayHasta) throw httpError(400, 'Indicá la hora de inicio y la de fin, o ninguna');
  if (hayDesde) {
    if (!HORA.test(c.hora_desde) || !HORA.test(c.hora_hasta)) throw httpError(400, 'Los horarios tienen el formato HH:MM');
    if (c.hora_hasta <= c.hora_desde) throw httpError(400, 'La hora de fin tiene que ser posterior a la de inicio');
  }
  if (c.tipo === 'HAPPY_HOUR' && !hayDesde) throw httpError(400, 'El Happy Hour necesita un horario');
  if (typeof c.activo !== 'boolean') throw httpError(400, 'activo tiene que ser verdadero o falso');
}

export async function listar(req, res, next) {
  try {
    res.json(await Promocion.listar());
  } catch (err) {
    next(err);
  }
}

// Las que valen ahora: la pantalla de venta las muestra y las puede guardar para trabajar sin conexión.
export async function vigentes(req, res, next) {
  try {
    res.json(await Promocion.vigentes());
  } catch (err) {
    next(err);
  }
}

export async function crear(req, res, next) {
  try {
    const c = { ...campos(req.body) };
    c.dias_semana ??= [0, 1, 2, 3, 4, 5, 6];
    c.activo ??= true;
    validar(c);
    res.status(201).json(await Promocion.crear(c, req.usuario.id));
  } catch (err) {
    next(err);
  }
}

// PUT: se mandan solo los datos que cambian; el resto queda como estaba.
export async function editar(req, res, next) {
  try {
    const id = idValido(req.params.id);
    const actual = await Promocion.obtener(id);
    if (!actual) throw httpError(404, 'Promoción no encontrada');
    const cambios = Object.fromEntries(Object.entries(campos(req.body)).filter(([, v]) => v !== undefined));
    if (Object.keys(cambios).length === 0) throw httpError(400, 'No hay nada para cambiar');
    const c = { ...actual, ...cambios };
    // Si pasa a ser de un producto, deja de ser de una categoría (y al revés)
    if (cambios.producto_codigo && cambios.categoria === undefined) c.categoria = null;
    if (cambios.categoria && cambios.producto_codigo === undefined) c.producto_codigo = null;
    validar(c);
    res.json(await Promocion.editar(id, c));
  } catch (err) {
    next(err);
  }
}

// Reutiliza una promoción con nuevas fechas: { fecha_desde, fecha_hasta }
export async function duplicar(req, res, next) {
  try {
    const actual = await Promocion.obtener(idValido(req.params.id));
    if (!actual) throw httpError(404, 'Promoción no encontrada');
    const { fecha_desde, fecha_hasta } = req.body ?? {};
    const c = { ...actual, fecha_desde, fecha_hasta, activo: true };
    validar(c);
    res.status(201).json(await Promocion.crear(c, req.usuario.id));
  } catch (err) {
    next(err);
  }
}