import { useId } from 'react';

// Campo de formulario con etiqueta, ayuda y mensaje de error asociados al input.
export default function Campo({ etiqueta, error, ayuda, ...resto }) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  return (
    <div className={`campo ${error ? 'campo-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : ayuda ? idAyuda : undefined}
        {...resto}
      />
      {ayuda && !error && <span id={idAyuda} className="campo-ayuda">{ayuda}</span>}
      {error && <span id={idError} className="campo-mensaje-error" role="alert">{error}</span>}
    </div>
  );
}
