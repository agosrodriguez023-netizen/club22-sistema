// backend/db/preparar.js
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// Configuración de rutas para módulos ES (type: module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

async function prepararBD() {
    try {
        console.log('Conectando a PostgreSQL...');
        
        // 1. Ejecutar el esquema de tablas
        const rutaEsquema = path.join(__dirname, 'migraciones', '001_esquema.sql');
        const sqlEsquema = fs.readFileSync(rutaEsquema, 'utf-8');
        await pool.query(sqlEsquema);
        console.log('✔ Esquema (001_esquema.sql) creado correctamente.');

        // 2. Ejecutar los datos semilla (productos, mesas, etc.)
        const rutaSeed = path.join(__dirname, 'seed.sql');
        if (fs.existsSync(rutaSeed)) {
            const sqlSeed = fs.readFileSync(rutaSeed, 'utf-8');
            await pool.query(sqlSeed);
            console.log('✔ Datos iniciales (seed.sql) cargados.');
        }

        // 3. Crear usuarios con contraseña cifrada (Costo de cifrado: 10)
        const passwordAdmin = await bcrypt.hash('admin123', 10);
        const passwordCaja = await bcrypt.hash('caja123', 10);

        await pool.query(`
            INSERT INTO usuarios (nombre, rol, password) VALUES 
            ('Admin', 'ADMINISTRADOR', $1),
            ('Caja', 'CAJERO', $2)
        `, [passwordAdmin, passwordCaja]);
        console.log('✔ Usuarios iniciales generados con contraseñas seguras.');

        console.log('¡La base de datos está lista para usarse!');
    } catch (error) {
        console.error('Error al preparar la base de datos:', error);
    } finally {
        await pool.end();
    }
}

prepararBD();