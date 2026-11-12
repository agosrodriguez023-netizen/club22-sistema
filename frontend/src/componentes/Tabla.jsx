// frontend/src/componentes/Tabla.jsx
import React from 'react';

export default function Tabla({ columnas, datos }) {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--gris-200)', color: 'var(--gris-600)' }}>
            {columnas.map((col, index) => (
              <th key={index} style={{ padding: '12px' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, rowIndex) => (
            <tr key={rowIndex} style={{ borderBottom: '1px solid var(--gris-100)' }}>
              {Object.values(fila).map((valor, cellIndex) => (
                <td key={cellIndex} style={{ padding: '12px', color: 'var(--gris-900)' }}>{valor}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}