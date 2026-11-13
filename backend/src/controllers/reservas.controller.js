import Reserva from '../models/reserva.model.js';
import { httpError } from '../utils/httpError.js';

// Duración que se usa cuando no se indica la hora de fin. [A CONFIRMAR] con el cliente.
const DURACION_MINUTOS = 120;

const texto = (x) => typeof x === 'string' && x.trim().length > 0;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function fechaValida(valor) {
  if (typeof valor !== 'string' || !FECHA.test(valor) || Number.isNaN(Date.parse(valor))) {
    throw httpError(400, 'La fecha tiene que tener el formato AAAA-MM-DD');
  }
  return valor;
}

function aMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function aHora(minutos) {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

/** Devuelve { hora_inicio, hora_fin }; si no llega la hora de fin, suma la duración estándar. */
function horario(inicio, fin) {
  if (typeof inicio !== 'string' || !HORA.test(inicio)) throw httpError(400, 'La hora de inicio tiene que tener el formato HH:MM');
  let hasta;
  if (fin === undefined || fin === null || fin === '') {
    const minutos = aMinutos(inicio) + DURACION_MINUTOS;
    if (minutos >= 24 * 60) throw httpError(400, 'La reserva tiene que terminar antes de medianoche: indicá la hora de fin');
    hasta = aHora(minutos);
  } else {
    if (typeof fin !== 'string' || !HORA.test(fin)) throw httpError(400, 'La hora de fin tiene que tener el formato HH:MM');
    hasta = fin;
  }
  if (aMinutos(hasta) <= aMinutos(inicio)) throw httpError(400, 'La hora de fin tiene que ser posterior a la de inicio');
  return { hora_inicio: inicio, hora_fin: hasta };
}

function idValido(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1) throw httpError(400, 'Reserva inválida');
  return id;
}

function personasValidas(valor) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1 || n > 50) throw httpError(400, 'Las personas tienen que ser un número entero entre 1 y 50');
  return n;
}

export async function listar(req, res, next) {
  try {
    res.json(await Reserva.listar(fechaValida(req.query.fecha)));
  } catch (err) {
    next(err);
  }
}

export async function disponibilidad(req, res, next) {
  try {
    const fecha = fechaValida(req.query.fecha);
    const { hora_inicio, hora_fin } = horario(req.query.hora, req.query.hasta);
    const personas = personasValidas(req.query.personas);
    res.json(await Reserva.disponibilidad({ fecha, hora_inicio, hora_fin, personas }));
  } catch (err) {
    next(err);
  }
}

export async function crear(req, res, next) {
  try {
    const c = req.body ?? {};
    const mesa_id = Number(c.mesa_id);
    if (!Number.isInteger(mesa_id) || mesa_id < 1) throw httpError(400, 'Elegí una mesa');
    const fecha = fechaValida(c.fecha);
    const { hora_inicio, hora_fin } = horario(c.hora_inicio, c.hora_fin);
    const personas = personasValidas(c.personas);
    if (!texto(c.nombre_cliente) || c.nombre_cliente.trim().length > 80) throw httpError(400, 'El nombre es obligatorio (hasta 80 caracteres)');
    if (!texto(c.contacto) || c.contacto.trim().length > 40) throw httpError(400, 'El contacto es obligatorio (hasta 40 caracteres)');
    if (c.observaciones != null && (typeof c.observaciones !== 'string' || c.observaciones.length > 200)) {
      throw httpError(400, 'Las observaciones tienen hasta 200 caracteres');
    }
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Cordoba' });
    if (fecha < hoy) throw httpError(400, 'No se puede reservar en una fecha pasada');
    const reserva = await Reserva.crear(
      { mesa_id, fecha, hora_inicio, hora_fin, personas, nombre_cliente: c.nombre_cliente, contacto: c.contacto, observaciones: c.observaciones },
      req.usuario.id
    );
    res.status(201).json(reserva);
  } catch (err) {
    next(err);
  }
}

export async function cancelar(req, res, next) {
  try {
    res.json(await Reserva.cancelar(idValido(req.params.id)));
  } catch (err) {
    next(err);
  }
}