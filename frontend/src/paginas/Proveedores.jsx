import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Modal from '../componentes/Modal.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const FORM_VACIO = { nombre: '', cuit: '', telefono: '', email: '' };

// Alta, edición y baja de proveedores (T-55). Lo ven Administrador e Inventario.
export default function Proveedores() {
  const [lista, setLista] = useState(null); // null = cargando
  const [errorLista, setErrorLista] = useState('');
  const [aviso, setAviso] = useState(null);

  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // null = proveedor nuevo
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    try {
      setLista(await pedir('/proveedores'));
      setErrorLista('');
    } catch (err) {
      setErrorLista(err.message);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  function abrirNuevo() {
    setEditando(null);
    setForm(FORM_VACIO);
    setErrorForm('');
    setAbierto(true);
  }

  function abrirEditar(p) {
    setEditando(p);
    setForm({ nombre: p.nombre, cuit: p.cuit ?? '', telefono: p.telefono ?? '', email: p.email ?? '' });
    setErrorForm('');
    setAbierto(true);
  }

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');
    if (!form.nombre.trim()) return setErrorForm('Ingresá el nombre del proveedor.');
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return setErrorForm('El email no parece válido.');

    const cuerpo = {
      nombre: form.nombre.trim(),
      cuit: form.cuit.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
    };

    setGuardando(true);
    try {
      if (editando) {
        await pedir(`/proveedores/${editando.id}`, { method: 'PUT', body: cuerpo });
        setAviso({ tipo: 'exito', texto: `Se guardaron los cambios de ${cuerpo.nombre}.` });
      } else {
        await pedir('/proveedores', { method: 'POST', body: cuerpo });
        setAviso({ tipo: 'exito', texto: `Proveedor ${cuerpo.nombre} creado.` });
      }
      setAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarActivo(p) {
    try {
      await pedir(`/proveedores/${p.id}`, {
        method: 'PUT',
        body: { nombre: p.nombre, cuit: p.cuit, telefono: p.telefono, email: p.email, activo: !p.activo },
      });
      setAviso({ tipo: 'exito', texto: p.activo ? `${p.nombre} se dio de baja.` : `${p.nombre} se reactivó.` });
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  }

  const columnas = [
    { clave: 'nombre', titulo: 'Proveedor' },
    { clave: 'cuit', titulo: 'CUIT', render: (p) => p.cuit ?? '—' },
    { clave: 'telefono', titulo: 'Teléfono', render: (p) => p.telefono ?? '—' },
    { clave: 'email', titulo: 'Email', render: (p) => p.email ?? '—' },
    { clave: 'activo', titulo: 'Estado', render: (p) => (p.activo === false ? 'Dado de baja' : 'Activo') },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      render: (p) => (
        <span className="usuarios-acciones">
          <Boton variante="secundario" aria-label={`Editar ${p.nombre}`} onClick={() => abrirEditar(p)}>Editar</Boton>
          <Boton
            variante={p.activo === false ? 'secundario' : 'peligro'}
            aria-label={`${p.activo === false ? 'Reactivar' : 'Dar de baja'} ${p.nombre}`}
            onClick={() => cambiarActivo(p)}
          >
            {p.activo === false ? 'Reactivar' : 'Baja'}
          </Boton>
        </span>
      ),
    },
  ];

  return (
    <>
      <h1>Proveedores</h1>
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta>
        <Boton onClick={abrirNuevo}>Nuevo proveedor</Boton>
        {lista === null && !errorLista && <Estado tipo="cargando" />}
        {errorLista && <Estado tipo="error">{errorLista}</Estado>}
        {lista && <Tabla columnas={columnas} filas={lista} claveFila="id" vacio="Todavía no hay proveedores cargados." />}
      </Tarjeta>

      <Modal abierto={abierto} titulo={editando ? `Editar ${editando.nombre}` : 'Nuevo proveedor'} onCerrar={() => setAbierto(false)}>
        <form onSubmit={guardar} noValidate>
          {errorForm && <Mensaje tipo="error">{errorForm}</Mensaje>}
          <Campo etiqueta="Nombre" value={form.nombre} onChange={cambiar('nombre')} autoComplete="off" />
          <Campo etiqueta="CUIT" value={form.cuit} onChange={cambiar('cuit')} autoComplete="off" />
          <Campo etiqueta="Teléfono" value={form.telefono} onChange={cambiar('telefono')} autoComplete="off" />
          <Campo etiqueta="Email" type="email" value={form.email} onChange={cambiar('email')} autoComplete="off" />
          <div className="modal-acciones">
            <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={guardando} textoCargando="Guardando…">Guardar</Boton>
          </div>
        </form>
      </Modal>
    </>
  );
}
