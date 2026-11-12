// utils/calculos.js

function subtotal(items) {
    // items = [{ precio: 150000, cantidad: 2 }, ...] (precios en centavos)
    return items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
}

function aplicarDescuento(subtotal, pct) {
    if (!pct || pct <= 0) return subtotal;
    // Se calcula el porcentaje y se redondea para mantener el formato entero de centavos
    return Math.round(subtotal * (1 - pct / 100));
}

function vuelto(total, recibido) {
    if (recibido < total) return 0; 
    return recibido - total;
}

export { subtotal, aplicarDescuento, vuelto };