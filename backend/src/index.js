import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('El servidor está vivo');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});