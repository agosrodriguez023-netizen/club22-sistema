import bcrypt from 'bcrypt';
import { pool, transaccion } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

export const ROLES = ['ADMINISTRADOR', 'CAJERO', 'SALA', 'INVENTARIO'];

// Nunca devolvemos la contraseña (ni cifrada).
const COLUMNAS = 'id, nombre, rol, activo';

const UsuarioAdmin = {
  async listar() {
    const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM usuarios ORDER BY nombre`);
    return rows;
  },

  async crear({ nombre, password, rol }, adminId) {
    return transaccion(async (client) => {
      const { rows: repetido } = await client.query(
        'SELECT 1 FROM usuarios WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))',
        [nombre]
      );
      if (repetido.length > 0) throw httpError(409, 'Ya existe un usuario con ese nombre');

      const hash = await bcrypt.hash(password, 10);
      const { rows } = await client.query(
        `INSERT INTO usuarios (nombre, password, rol, activo)
         VALUES (TRIM($1), $2, $3, TRUE) RETURNING ${COLUMNAS}`,
        [nombre, hash, rol]
      );
      await client.query(
        `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, despues)
         VALUES ($1, 'ALTA_USUARIO', 'usuarios', $2, $3)`,
        [adminId, rows[0].id, JSON.stringify(rows[0])]
      );
      return rows[0];
    });
  },

  async editar(id, cambios, adminId) {
    return transaccion(async (client) => {
      const { rows: actual } = await client.query(
        `SELECT ${COLUMNAS} FROM usuarios WHERE id = $1 FOR UPDATE`, [id]
      );
      if (actual.length === 0) throw httpError(404, 'Usuario no encontrado');
      const antes = actual[0];

      // Para no quedarse sin acceso
      if (Number(id) === Number(adminId)) {
        if (cambios.activo === false) throw httpError(400, 'No podés darte de baja a vos mismo');
        if (cambios.rol && cambios.rol !== antes.rol) throw httpError(400, 'No podés cambiar tu propio rol');
      }

      if (cambios.nombre !== undefined) {
        const { rows: repetido } = await client.query(
          'SELECT 1 FROM usuarios WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1)) AND id <> $2',
          [cambios.nombre, id]
        );
        if (repetido.length > 0) throw httpError(409, 'Ya existe un usuario con ese nombre');
      }

      // UPDATE solo con los campos que llegaron
      const sets = [];
      const valores = [];
      const agregar = (columna, valor) => {
        valores.push(valor);
        sets.push(`${columna} = $${valores.length}`);
      };
      if (cambios.nombre !== undefined) agregar('nombre', cambios.nombre.trim());
      if (cambios.rol !== undefined) agregar('rol', cambios.rol);
      if (cambios.activo !== undefined) agregar('activo', cambios.activo);
      if (cambios.password !== undefined) agregar('password', await bcrypt.hash(cambios.password, 10));
      if (sets.length === 0) throw httpError(400, 'No hay nada para cambiar');

      valores.push(id);
      const { rows } = await client.query(
        `UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${valores.length} RETURNING ${COLUMNAS}`,
        valores
      );
      await client.query(
        `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, antes, despues)
         VALUES ($1, 'EDICION_USUARIO', 'usuarios', $2, $3, $4)`,
        [adminId, id, JSON.stringify(antes),
         JSON.stringify({ ...rows[0], clave_cambiada: cambios.password !== undefined })]
      );
      return rows[0];
    });
  },
};

export default UsuarioAdmin;