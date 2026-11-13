import UsuarioAdmin, { ROLES } from '../models/usuarioAdmin.model.js';
import Auditoria from '../models/auditoria.model.js';
import { httpError } from '../utils/httpError.js';

const texto = (x) => typeof x === 'string' && x.trim().length > 0;

function validarNombre(nombre) {
  if (!texto(nombre) || nombre.trim().length > 100) throw httpError(400, 'El nombre es obligatorio (hasta 100 caracteres)');
}
function validarRol(rol) {
  if (!ROLES.includes(rol)) throw httpError(400, `El rol tiene que ser uno de: ${ROLES.join(', ')}`);
}
function validarPassword(password) {
  if (typeof password !== 'string' || password.length < 8) throw httpError(400, 'La contraseña tiene que tener al menos 8 caracteres');
}

export async function listar(req, res, next) {
  try { res.json(await UsuarioAdmin.listar()); } catch (err) { next(err); }
}

export async function crear(req, res, next) {
  try {
    const { nombre, password, rol } = req.body ?? {};
    validarNombre(nombre);
    validarPassword(password);
    validarRol(rol);
    res.status(201).json(await UsuarioAdmin.crear({ nombre, password, rol }, req.usuario.id));
  } catch (err) { next(err); }
}

export async function editar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw httpError(400, 'Usuario inválido');
    const { nombre, password, rol, activo } = req.body ?? {};
    if (nombre !== undefined) validarNombre(nombre);
    if (password !== undefined) validarPassword(password);
    if (rol !== undefined) validarRol(rol);
    if (activo !== undefined && typeof activo !== 'boolean') throw httpError(400, '"activo" tiene que ser verdadero o falso');
    res.json(await UsuarioAdmin.editar(id, { nombre, password, rol, activo }, req.usuario.id));
  } catch (err) { next(err); }
}

export async function auditoria(req, res, next) {
  try {
    const { accion, usuario_id, desde, hasta } = req.query;
    const fecha = /^\d{4}-\d{2}-\d{2}$/;
    if ((desde && !fecha.test(desde)) || (hasta && !fecha.test(hasta))) {
      throw httpError(400, 'Las fechas van como AAAA-MM-DD');
    }
    const limite = Math.min(Number(req.query.limite) || 100, 500);
    res.json(await Auditoria.listar({
      accion, usuario_id: usuario_id ? Number(usuario_id) : undefined, desde, hasta, limite,
    }));
  } catch (err) { next(err); }
}