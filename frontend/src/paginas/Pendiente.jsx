import Estado from '../componentes/Estado.jsx';

// Pantalla de relleno para las secciones que se construyen el día 2.
export default function Pendiente({ titulo }) {
  return (
    <>
      <h1>{titulo}</h1>
      <Estado tipo="vacio">Esta pantalla se construye el día 2.</Estado>
    </>
  );
}
