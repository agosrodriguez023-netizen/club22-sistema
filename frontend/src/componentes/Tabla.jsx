import Estado from './Estado.jsx';

/**
 * columnas: [{ clave: 'nombre', titulo: 'Producto', render?: (fila) => ... }]
 * filas: arreglo de objetos. Si está vacío muestra el estado "vacío".
 */
export default function Tabla({ columnas, filas, claveFila = 'id', vacio = 'No hay datos para mostrar.' }) {
  if (!filas || filas.length === 0) return <Estado tipo="vacio">{vacio}</Estado>;
  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>{columnas.map((c) => <th key={c.clave} scope="col">{c.titulo}</th>)}</tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={fila[claveFila] ?? i}>
              {columnas.map((c) => (
                <td key={c.clave}>{c.render ? c.render(fila) : fila[c.clave]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
