// Genera datos de ejemplo para la demostración: 14 días de ventas con sus cierres de caja
// y 6 reservas para el próximo viernes y sábado.
//
// Uso (desde la carpeta backend):
//   node scripts/seed-historia.js              crea la historia (si ya está, avisa y no hace nada)
//   node scripts/seed-historia.js --rehacer    borra la historia anterior y la genera de nuevo
//
// Todo lo que crea se puede reconocer (y borrar) sin tocar tus ventas reales:
//   - las ventas tienen un uuid_cliente que empieza con 00000022-0000-4000-8000-
//   - las reservas tienen la observación "Ejemplo: ..."
// No modifica el stock ni crea movimientos de stock: es solo historia para los reportes.
import pool, { transaccion } from '../src/config/db.js';

const ZONA = 'America/Argentina/Cordoba';
const PREFIJO_UUID = '00000022-0000-4000-8000-';
const DIAS = 14;
const FONDO_FIJO = 20000;

// Números "al azar" que siempre dan lo mismo (así los reportes se ven igual en cada máquina)
let semilla = 2222;
function azar() {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const entre = (min, max) => min + Math.floor(azar() * (max - min + 1));
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
function elegirConPeso(opciones) { // opciones: [[valor, peso], ...]
  let r = azar() * opciones.reduce((s, [, p]) => s + p, 0);
  for (const [valor, peso] of opciones) { r -= peso; if (r < 0) return valor; }
  return opciones[opciones.length - 1][0];
}

// Fechas
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: ZONA }); // AAAA-MM-DD
function sumarDias(fecha, n) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const diaSemana = (fecha) => new Date(`${fecha}T12:00:00Z`).getUTCDay(); // 0 = domingo
const dosDigitos = (n) => String(n).padStart(2, '0');

// Cuántas ventas hay por día: más los viernes y sábados.
function cantidadDeVentas(dia) {
  if (dia === 5) return entre(24, 30);
  if (dia === 6) return entre(28, 36);
  if (dia === 0) return entre(12, 16);
  return entre(10, 16);
}
const HORAS = [[12, 1], [13, 2], [14, 1], [17, 1], [18, 3], [19, 4], [20, 4], [21, 3], [22, 2], [23, 1]];
const MEDIOS = [['Efectivo', 35], ['Débito', 25], ['Crédito', 20], ['Transferencia', 12], ['QR', 8]];

async function borrarHistoria(client) {
  const { rows } = await client.query(
    `SELECT id, cierre_id FROM venta WHERE uuid_cliente::text LIKE $1`, [`${PREFIJO_UUID}%`]
  );
  const ventas = rows.map((r) => r.id);
  const cierres = [...new Set(rows.map((r) => r.cierre_id).filter(Boolean))];
  if (ventas.length > 0) {
    await client.query('DELETE FROM comprobante WHERE venta_id = ANY($1)', [ventas]);
    await client.query('DELETE FROM venta WHERE id = ANY($1)', [ventas]); // el detalle se borra solo
  }
  if (cierres.length > 0) {
    await client.query('DELETE FROM cierre_total_medio WHERE cierre_id = ANY($1)', [cierres]);
    await client.query('DELETE FROM cierre_de_caja WHERE id = ANY($1)', [cierres]);
  }
  await client.query(`DELETE FROM reserva WHERE observaciones LIKE 'Ejemplo:%'`);
  return ventas.length;
}

async function generarVentas(client, { cajeroId, medios, productos, mesas }) {
  let totalVentas = 0;
  let numero = 0;
  for (let i = DIAS; i >= 1; i--) {
    const dia = sumarDias(hoy, -i);
    const horas = Array.from({ length: cantidadDeVentas(diaSemana(dia)) }, () => ({
      h: elegirConPeso(HORAS), m: entre(0, 59),
    })).sort((a, b) => a.h - b.h || a.m - b.m);

    // 1) Armar las ventas del día en memoria
    const ventas = horas.map(({ h, m }) => {
      const destino = azar() < 0.55 ? 'MESA' : 'LLEVAR';
      const campoPrecio = destino === 'MESA' ? 'precio_mesa' : 'precio_mostrador';
      const vendibles = productos.filter((p) => p[campoPrecio] > 0);
      const elegidos = new Set();
      const lineas = [];
      for (let k = entre(1, 3); k > 0; k--) {
        const p = elegir(vendibles);
        if (elegidos.has(p.codigo)) continue;
        elegidos.add(p.codigo);
        const cantidad = elegirConPeso([[1, 60], [2, 30], [3, 10]]);
        lineas.push({ codigo: p.codigo, cantidad, precio: p[campoPrecio], subtotal: p[campoPrecio] * cantidad });
      }
      const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
      const descuentoPct = azar() < 0.08 ? 10 : 0; // algunas ventas con descuento manual
      const descuento = Math.round((subtotal * descuentoPct) / 100);
      const total = subtotal - descuento;
      const medio = medios.get(elegirConPeso(MEDIOS));
      const recibido = medio.es_efectivo ? Math.ceil(total / 1000) * 1000 : null;
      numero += 1;
      return {
        uuid: `${PREFIJO_UUID}${String(numero).padStart(12, '0')}`,
        fecha_hora: `${dia}T${dosDigitos(h)}:${dosDigitos(m)}:00-03:00`,
        destino, mesa_id: destino === 'MESA' ? elegir(mesas).id : null,
        lineas, subtotal, descuentoPct, descuento, total, medio, recibido,
        vuelto: recibido === null ? null : recibido - total,
      };
    });

    // 2) Cierre de caja del día. Dos días tienen diferencia (con observación, RN-02).
    const total = ventas.reduce((s, v) => s + v.total, 0);
    const efectivo = ventas.filter((v) => v.medio.es_efectivo).reduce((s, v) => s + v.total, 0);
    const esperado = FONDO_FIJO + efectivo;
    const diferencia = { 11: -1500, 5: 800 }[i] ?? 0;
    const observacion = { 11: 'Faltante: se dio un vuelto de más', 5: 'Sobrante: una propina quedó en la caja' }[i] ?? null;
    const { rows: [cierre] } = await client.query(
      `INSERT INTO cierre_de_caja (fecha_hora, usuario_id, fondo_fijo, efectivo_esperado, efectivo_contado,
                                   diferencia, total_ventas, cantidad_ventas, observacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [`${dia}T23:59:00-03:00`, cajeroId, FONDO_FIJO, esperado, esperado + diferencia, diferencia, total, ventas.length, observacion]
    );
    const porMedio = new Map();
    for (const v of ventas) porMedio.set(v.medio.id, (porMedio.get(v.medio.id) ?? 0) + v.total);
    for (const [medioId, t] of porMedio) {
      await client.query('INSERT INTO cierre_total_medio (cierre_id, medio_pago_id, total) VALUES ($1, $2, $3)', [cierre.id, medioId, t]);
    }

    // 3) Guardar las ventas con su detalle y su ticket
    for (const v of ventas) {
      const { rows: [nueva] } = await client.query(
        `INSERT INTO venta (uuid_cliente, fecha_hora, usuario_id, destino, mesa_id, subtotal, descuento_manual_pct,
                            descuento_total, total, medio_pago_id, monto_recibido, vuelto, origen, cierre_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ONLINE', $13) RETURNING id`,
        [v.uuid, v.fecha_hora, cajeroId, v.destino, v.mesa_id, v.subtotal, v.descuentoPct, v.descuento, v.total,
         v.medio.id, v.recibido, v.vuelto, cierre.id]
      );
      for (const l of v.lineas) {
        await client.query(
          `INSERT INTO detalle_venta (venta_id, producto_codigo, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)`,
          [nueva.id, l.codigo, l.cantidad, l.precio, l.subtotal]
        );
      }
      await client.query('INSERT INTO comprobante (venta_id) VALUES ($1)', [nueva.id]);
    }
    totalVentas += ventas.length;
  }
  return totalVentas;
}

// Próxima fecha (desde mañana) que cae en el día de la semana pedido.
function proximo(dia) {
  for (let n = 1; n <= 7; n++) if (diaSemana(sumarDias(hoy, n)) === dia) return sumarDias(hoy, n);
}

async function generarReservas(client, { adminId, mesas }) {
  const mesa = (etiqueta) => mesas.find((m) => m.etiqueta === etiqueta)?.id;
  const viernes = proximo(5);
  const sabado = proximo(6);
  // [fecha, desde, hasta, mesa, personas, nombre, contacto, nota]
  const lista = [
    [viernes, '20:00', '22:00', 'Salón 1',   4, 'Carolina Ledesma', '351 555-0111', 'Aniversario'],
    [viernes, '21:00', '23:00', 'Ventana 2', 3, 'Martín Quiroga',   '351 555-0112', null],
    [viernes, '20:30', '22:30', 'Cava',      8, 'Familia Bustos',   '351 555-0113', 'Degustación de tintos'],
    [sabado,  '20:00', '22:00', 'Salón 3',   6, 'Julieta Ferreyra', '351 555-0114', null],
    [sabado,  '21:30', '23:30', 'Vereda 1',  2, 'Nicolás Paz',      '351 555-0115', 'Prefiere al aire libre'],
    [sabado,  '22:00', '23:59', 'Barra alta 1', 2, 'Lucía Moyano',  '351 555-0116', null],
  ];
  let creadas = 0;
  for (const [fecha, desde, hasta, etiqueta, personas, nombre, contacto, nota] of lista) {
    const mesaId = mesa(etiqueta);
    if (!mesaId) continue; // si en el salón no existe esa mesa, se salta
    await client.query(
      `INSERT INTO reserva (mesa_id, fecha, hora_inicio, hora_fin, personas, nombre_cliente, contacto, observaciones, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [mesaId, fecha, desde, hasta, personas, nombre, contacto, `Ejemplo: ${nota ?? 'reserva de prueba'}`, adminId]
    );
    creadas += 1;
  }
  return creadas;
}

const rehacer = process.argv.includes('--rehacer');
try {
  const resultado = await transaccion(async (client) => {
    const { rows: yaHay } = await client.query(`SELECT 1 FROM venta WHERE uuid_cliente::text LIKE $1 LIMIT 1`, [`${PREFIJO_UUID}%`]);
    if (yaHay.length > 0 && !rehacer) return null;
    const borradas = rehacer ? await borrarHistoria(client) : 0;

    const { rows: usuarios } = await client.query(`SELECT id, rol FROM usuarios WHERE activo = TRUE ORDER BY id`);
    const admin = usuarios.find((u) => u.rol === 'ADMINISTRADOR');
    const cajero = usuarios.find((u) => u.rol === 'CAJERO') ?? admin;
    if (!admin) throw new Error('Primero tiene que existir un usuario Administrador');
    const { rows: listaMedios } = await client.query('SELECT id, nombre, es_efectivo FROM medio_de_pago WHERE activo = TRUE');
    const medios = new Map(listaMedios.map((m) => [m.nombre, m]));
    for (const [nombre] of MEDIOS) if (!medios.has(nombre)) throw new Error(`Falta el medio de pago "${nombre}"`);
    const { rows: productos } = await client.query(
      'SELECT codigo, precio_mostrador, precio_mesa FROM productos WHERE activo = TRUE ORDER BY codigo'
    );
    const { rows: mesas } = await client.query('SELECT id, etiqueta FROM mesa WHERE activo = TRUE ORDER BY id');
    if (productos.length === 0 || mesas.length === 0) throw new Error('Faltan productos o mesas: corré antes el seed.sql');

    const ventas = await generarVentas(client, { cajeroId: cajero.id, medios, productos, mesas });
    const reservas = await generarReservas(client, { adminId: admin.id, mesas });
    return { borradas, ventas, reservas };
  });

  if (resultado === null) {
    console.log('La historia ya estaba cargada. Si querés generarla de nuevo: node scripts/seed-historia.js --rehacer');
  } else {
    if (rehacer) console.log(`Se borraron ${resultado.borradas} ventas de la historia anterior.`);
    console.log(`Listo: ${resultado.ventas} ventas en ${DIAS} días, con sus cierres de caja, y ${resultado.reservas} reservas de ejemplo.`);
  }
} finally {
  await pool.end();
}