// tests/calculos.test.js
import test from 'node:test';
import assert from 'node:assert';
import { aplicarDescuento, vuelto } from '../utils/calculos.js';

test('Cálculo del BUG-02: $3.333 con 15% de descuento y $5.000 recibidos', () => {
    // 1. Definimos los valores multiplicados por 100 (centavos)
    const subtotalCentavos = 333300; // $3.333,00
    const porcentajeDescuento = 15;
    const importeRecibido = 500000;  // $5.000,00

    // 2. Aplicamos el descuento
    // Cálculo esperado: 333300 * 0.85 = 283305 centavos ($2.833,05)
    const totalAPagar = aplicarDescuento(subtotalCentavos, porcentajeDescuento);
    assert.strictEqual(totalAPagar, 283305, 'El total con descuento falla');

    // 3. Calculamos el vuelto
    // Cálculo esperado: 500000 - 283305 = 216695 centavos ($2.166,95)
    const vueltoCalculado = vuelto(totalAPagar, importeRecibido);
    assert.strictEqual(vueltoCalculado, 216695, 'El cálculo del vuelto falla');
});