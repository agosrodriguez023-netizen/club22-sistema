// variante: 'primario' | 'secundario' | 'peligro'. Si cargando=true se deshabilita y muestra el texto de espera.
export default function Boton({ variante = 'primario', cargando = false, textoCargando = 'Un momento…', children, disabled, ...resto }) {
  return (
    <button
      className={`boton boton-${variante}`}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? textoCargando : children}
    </button>
  );
}
