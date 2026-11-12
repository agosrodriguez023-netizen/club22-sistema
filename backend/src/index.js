import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración fundamental para que React (Frontend) pueda comunicarse y para leer JSONs
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Conectamos las rutas
app.use('/api', authRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});