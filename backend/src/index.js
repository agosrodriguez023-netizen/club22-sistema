import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import productosRoutes from './routes/productos.routes.js';
import ventasRoutes from './routes/ventas.routes.js';
import cajaRoutes from './routes/caja.routes.js';
import { errores } from './middlewares/errores.js';
import mediosPagoRoutes from './routes/mediosPago.routes.js';
import catalogoRoutes from './routes/catalogo.routes.js';


const app = express();
const port = process.env.PORT || 3000;

// Configuración fundamental para que React (Frontend) pueda comunicarse y para leer JSONs
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Conectamos las rutas
app.use('/api', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/medios-pago', mediosPagoRoutes);
app.use('/api/catalogo', catalogoRoutes);

// atrapa los errores de todas las rutas de arriba (siempre va al final de las rutas)
app.use(errores);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});