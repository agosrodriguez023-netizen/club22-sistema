// Guarda la contraseña cifrada con bcrypt para el usuario indicado (por su nombre).
import bcrypt from 'bcrypt';
import pool from '../src/config/db.js';

const [nombre, clave] = process.argv.slice(2);
if (!nombre || !clave) {
  console.error('Uso: node scripts/resetear-clave.js "<nombre>" "<contraseña>"');
  process.exit(1);
}

const hash = await bcrypt.hash(clave, 10);
const { rowCount } = await pool.query(
  'UPDATE usuarios SET password = $1, activo = true WHERE LOWER(nombre) = LOWER($2)',
  [hash, nombre]
);
console.log(rowCount === 1 ? `Listo: contraseña de "${nombre}" actualizada.` : `No encontré un usuario llamado "${nombre}".`);

const { rows } = await pool.query(
  'SELECT password FROM usuarios WHERE LOWER(nombre) = LOWER($1)', [nombre]
);
console.log('filas encontradas:', rows.length);
console.log('largo del hash:', rows[0]?.password.length);
console.log('la clave coincide:', await bcrypt.compare(clave, rows[0].password));
await pool.end();