export default function Tarjeta({ titulo, children }) {
  return (
    <section className="tarjeta">
      {titulo && <h2>{titulo}</h2>}
      {children}
    </section>
  );
}
