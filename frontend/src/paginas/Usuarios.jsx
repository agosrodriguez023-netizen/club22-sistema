import { useEffect, useState } from 'react';
import { pedir } from '../api/cliente.js';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from '../componentes/Boton.jsx';
import Campo from '../componentes/Campo.jsx';
import Estado from '../componentes/Estado.jsx';
import Mensaje from '../componentes/Mensaje.jsx';
import Modal from '../componentes/Modal.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const ROLES = {
  ADMINISTRADOR: 'Administrador',
  CAJERO: 'Cajero',
  SALA: 'Personal de sala',
  INVENTARIO: 'Encargado de inventario',
};
const FORM_VACIO = { nombre: '', rol: 'CAJERO', password: '' };

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState(null); // null = cargando
  const [errorLista, setErrorLista] = useState('');
  const [aviso, setAviso] = useState(null);       // { tipo, texto }

  const [abierto, setAbierto] = useState(false);  // ventana de alta / edición
  const [editando, setEditando] = useState(null); // null = usuario nuevo
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [paraCambiar, setParaCambiar] = useState(null); // usuario a dar de baja / reactivar

  async function cargar() {
    try {
      setUsuarios(await pedir('/usuarios'));
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

  function abrirEditar(u) {
    setEditando(u);
    setForm({ nombre: u.nombre, rol: u.rol, password: '' });
    setErrorForm('');
    setAbierto(true);
  }

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');
    if (!form.nombre.trim()) return setErrorForm('Escribí el nombre del usuario.');
    if (!editando && form.password.length < 8) return setErrorForm('La contraseña tiene que tener al menos 8 caracteres.');
    if (editando && form.password && form.password.length < 8) return setErrorForm('La contraseña nueva tiene que tener al menos 8 caracteres.');

    setGuardando(true);
    try {
      if (editando) {
        const cambios = { nombre: form.nombre.trim(), rol: form.rol };
        if (form.password) cambios.password = form.password;
        await pedir(`/usuarios/${editando.id}`, { method: 'PUT', body: cambios });
        setAviso({ tipo: 'exito', texto: `Se guardaron los cambios de ${form.nombre.trim()}.` });
      } else {
        await pedir('/usuarios', { method: 'POST', body: { nombre: form.nombre.trim(), rol: form.rol, password: form.password } });
        setAviso({ tipo: 'exito', texto: `Usuario ${form.nombre.trim()} creado.` });
      }
      setAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarCambioEstado() {
    const u = paraCambiar;
    try {
      await pedir(`/usuarios/${u.id}`, { method: 'PUT', body: { activo: !u.activo } });
      setAviso({ tipo: 'exito', texto: u.activo ? `${u.nombre} quedó dado de baja.` : `${u.nombre} volvió a estar activo.` });
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setParaCambiar(null);
    }
  }

  const columnas = [
    { clave: 'nombre', titulo: 'Nombre' },
    { clave: 'rol', titulo: 'Rol', render: (u) => ROLES[u.rol] ?? u.rol },
    { clave: 'activo', titulo: 'Estado', render: (u) => (u.activo ? 'Activo' : 'De baja') },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      render: (u) => (
        <span className="usuarios-acciones">
          <Boton variante="secundario" aria-label={`Editar ${u.nombre}`} onClick={() => abrirEditar(u)}>Editar</Boton>
          <Boton
            variante={u.activo ? 'peligro' : 'secundario'}
            aria-label={`${u.activo ? 'Dar de baja a' : 'Reactivar a'} ${u.nombre}`}
            disabled={u.id === yo.id}
            onClick={() => setParaCambiar(u)}
          >
            {u.activo ? 'Dar de baja' : 'Reactivar'}
          </Boton>
        </span>
      ),
    },
  ];

  return (
    <>
      <h1>Usuarios</h1>
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta>
        <div className="usuarios-cabecera">
          <p>Las personas que pueden entrar al sistema y qué pueden hacer según su rol.</p>
          <Boton onClick={abrirNuevo}>Nuevo usuario</Boton>
        </div>
        {usuarios === null && !errorLista && <Estado tipo="cargando" />}
        {errorLista && <Estado tipo="error">{errorLista}</Estado>}
        {usuarios && <Tabla columnas={columnas} filas={usuarios} claveFila="id" vacio="Todavía no hay usuarios." />}
      </Tarjeta>

      <Modal abierto={abierto} titulo={editando ? `Editar a ${editando.nombre}` : 'Nuevo usuario'} onCerrar={() => setAbierto(false)}>
        <form onSubmit={guardar} noValidate>
          {errorForm && <Mensaje tipo="error">{errorForm}</Mensaje>}
          <Campo etiqueta="Nombre" value={form.nombre} onChange={cambiar('nombre')} autoComplete="off" />
          <div className="campo">
            <label htmlFor="usuario-rol">Rol</label>
            <select id="usuario-rol" value={form.rol} onChange={cambiar('rol')} disabled={editando?.id === yo.id}>
              {Object.entries(ROLES).map(([valor, texto]) => (
                <option key={valor} value={valor}>{texto}</option>
              ))}
            </select>
            {editando?.id === yo.id && <span className="campo-ayuda">No podés cambiar tu propio rol.</span>}
          </div>
          <Campo
            etiqueta={editando ? 'Contraseña nueva (opcional)' : 'Contraseña'}
            type="password"
            value={form.password}
            onChange={cambiar('password')}
            ayuda="Mínimo 8 caracteres."
            autoComplete="new-password"
          />
          <div className="modal-acciones">
            <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={guardando} textoCargando="Guardando…">Guardar</Boton>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={paraCambiar !== null}
        titulo={paraCambiar?.activo ? 'Dar de baja' : 'Reactivar usuario'}
        onCerrar={() => setParaCambiar(null)}
      >
        <p>
          {paraCambiar?.activo
            ? `${paraCambiar?.nombre} ya no va a poder entrar al sistema. ¿Confirmás la baja?`
            : `${paraCambiar?.nombre} va a poder entrar de nuevo. ¿Confirmás?`}
        </p>
        <div className="modal-acciones">
          <Boton variante="secundario" onClick={() => setParaCambiar(null)}>Cancelar</Boton>
          <Boton variante={paraCambiar?.activo ? 'peligro' : 'primario'} onClick={confirmarCambioEstado}>Confirmar</Boton>
        </div>
      </Modal>
    </>
  );
}
