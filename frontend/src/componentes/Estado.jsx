// tipo: 'vacio' | 'cargando' | 'error'
const TEXTOS = {
  vacio: 'No hay datos para mostrar.',
  cargando: 'Cargando…',
  error: 'No pudimos cargar la información.',
};

export default function Estado({ tipo = 'vacio', children }) {
  return (
    <div className="estado" role={tipo === 'error' ? 'alert' : 'status'}>
      {children ?? TEXTOS[tipo]}
    </div>
  );
}
