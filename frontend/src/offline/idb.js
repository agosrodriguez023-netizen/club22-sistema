// Capa mínima sobre IndexedDB (la base del navegador). Sin librerías.
// Una sola base ("club22") con tres "almacenes":
//   catalogo -> productos (clave: codigo)
//   cola     -> ventas pendientes de enviar (clave: uuid_cliente)  [paso 16]
//   meta     -> datos sueltos, como la fecha de la última descarga (clave: clave)
const NOMBRE = 'club22';
const VERSION = 1;

let conexion = null;

function abrir() {
  if (conexion) return conexion;
  conexion = new Promise((resolver, rechazar) => {
    const pedido = indexedDB.open(NOMBRE, VERSION);
    // Se ejecuta solo la primera vez (o al subir VERSION): crea los almacenes.
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      db.createObjectStore('catalogo', { keyPath: 'codigo' });
      db.createObjectStore('cola', { keyPath: 'uuid_cliente' });
      db.createObjectStore('meta', { keyPath: 'clave' });
    };
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  });
  return conexion;
}

// Convierte el "pedido" de IndexedDB (con eventos) en una promesa.
function esperar(pedido) {
  return new Promise((resolver, rechazar) => {
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  });
}

async function almacen(nombre, modo = 'readonly') {
  const db = await abrir();
  return db.transaction(nombre, modo).objectStore(nombre);
}

export async function obtener(nombre, clave) {
  return esperar((await almacen(nombre)).get(clave));
}

export async function todos(nombre) {
  return esperar((await almacen(nombre)).getAll());
}

export async function guardar(nombre, valor) {
  return esperar((await almacen(nombre, 'readwrite')).put(valor));
}

export async function borrar(nombre, clave) {
  return esperar((await almacen(nombre, 'readwrite')).delete(clave));
}

/** Reemplaza todo el contenido del almacén en UNA transacción: o queda todo, o queda lo anterior. */
export async function reemplazarTodo(nombre, valores) {
  const db = await abrir();
  return new Promise((resolver, rechazar) => {
    const tx = db.transaction(nombre, 'readwrite');
    const alm = tx.objectStore(nombre);
    alm.clear();
    valores.forEach((v) => alm.put(v));
    tx.oncomplete = () => resolver();
    tx.onerror = () => rechazar(tx.error);
    tx.onabort = () => rechazar(tx.error);
  });
}