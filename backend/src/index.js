import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import productosRoutes from './routes/productos.routes.js';
dotenv.config();
import cajaRoutes from './routes/caja.routes.js';

const app = express();
const port = process.env.PORT || 3000;

// Configuración fundamental para que React (Frontend) pueda comunicarse y para leer JSONs
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Conectamos las rutas
app.use('/api', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/caja', cajaRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});


