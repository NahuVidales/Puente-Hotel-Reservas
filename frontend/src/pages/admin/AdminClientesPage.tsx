import { useState, useEffect } from 'react';
import { clienteService, Cliente } from '../../services/clientes.service';
import toast from 'react-hot-toast';
import { formatearTimestamp, formatearTimestampCorto } from '../../utils/helpers';
import './AdminPages.css';
import './AdminEmpleadosPage.css';

export function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState('');
  
  // Estado del formulario de creación
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creando, setCreando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // Estado del modal de edición
  const [clienteEnEdicion, setClienteEnEdicion] = useState<Cliente | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: ''
  });
  const [editando, setEditando] = useState(false);
  const [erroresEdicion, setErroresEdicion] = useState<string[]>([]);

  // Cargar clientes al montar
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const data = await clienteService.getClientes();
      setClientes(data);
      console.log('[AdminClientes] Clientes cargados:', data.length);
    } catch (error: any) {
      console.error('[AdminClientes] Error al cargar clientes:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !apellido || !telefono || !email || !password) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (password.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setCreando(true);
    try {
      const response = await clienteService.crearCliente({
        nombre,
        apellido,
        telefono,
        email,
        password
      });

      toast.success(response.mensaje);
      setClientes([response.cliente, ...clientes]);

      // Limpiar formulario
      setNombre('');
      setApellido('');
      setTelefono('');
      setEmail('');
      setPassword('');
      setMostrarFormulario(false);
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al crear cliente';
      toast.error(mensaje);
    } finally {
      setCreando(false);
    }
  };

  const cerrarDetalle = () => {
    setClienteSeleccionado(null);
  };

  // Funciones de validación para edición
  const validarEmail = (email: string): boolean => {
    return email.includes('@') && email.includes('.');
  };

  const validarEdicion = (): boolean => {
    const errores: string[] = [];

    if (!editForm.nombre.trim()) {
      errores.push('El nombre es obligatorio');
    }
    if (!editForm.apellido.trim()) {
      errores.push('El apellido es obligatorio');
    }
    if (!editForm.email.trim()) {
      errores.push('El email es obligatorio');
    } else if (!validarEmail(editForm.email)) {
      errores.push('El email debe ser válido');
    }
    if (!editForm.telefono.trim()) {
      errores.push('El teléfono es obligatorio');
    }

    setErroresEdicion(errores);
    return errores.length === 0;
  };

  const handleEditarCliente = (cliente: Cliente) => {
    if (cliente.rol !== 'CLIENTE') {
      toast.error('Solo se pueden editar clientes con rol CLIENTE');
      return;
    }
    setClienteEnEdicion(cliente);
    setEditForm({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono
    });
    setErroresEdicion([]);
  };

  const cerrarEdicion = () => {
    setClienteEnEdicion(null);
    setEditForm({
      nombre: '',
      apellido: '',
      email: '',
      telefono: ''
    });
    setErroresEdicion([]);
  };

  const handleGuardarEdicion = async () => {
    if (!validarEdicion() || !clienteEnEdicion) return;

    setEditando(true);
    try {
      const response = await clienteService.actualizarCliente(clienteEnEdicion.id, {
        nombre: editForm.nombre.trim(),
        apellido: editForm.apellido.trim(),
        email: editForm.email.trim(),
        telefono: editForm.telefono.trim()
      });

      // Actualizar la lista de clientes
      setClientes(clientes.map(c => 
        c.id === clienteEnEdicion.id 
          ? response.cliente 
          : c
      ));

      // Si el cliente es el que está seleccionado, actualizar también su detalle
      if (clienteSeleccionado?.id === clienteEnEdicion.id) {
        setClienteSeleccionado(response.cliente);
      }

      toast.success(response.mensaje);
      cerrarEdicion();
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al actualizar cliente';
      toast.error(mensaje);
    } finally {
      setEditando(false);
    }
  };

  const handleEliminarCliente = async () => {
    if (!clienteSeleccionado) return;

    if (!window.confirm(`¿Está seguro que desea eliminar a ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setEliminando(true);
    try {
      await clienteService.eliminarCliente(clienteSeleccionado.id);
      toast.success('Cliente eliminado correctamente');
      setClientes(clientes.filter(c => c.id !== clienteSeleccionado.id));
      setClienteSeleccionado(null);
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al eliminar cliente';
      toast.error(mensaje);
    } finally {
      setEliminando(false);
    }
  };

  // Función para obtener el icono del rol
  const getRolIcon = (rol: string) => {
    switch(rol?.toUpperCase()) {
      case 'RESPONSABLE':
        return '👨‍💼';
      case 'CLIENTE':
        return '👤';
      default:
        return '👤';
    }
  };

  // Función para normalizar texto (sin tildes, minúsculas)
  const normalizarTexto = (texto: string): string => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Función para filtrar clientes
  const clientesFiltrados = busqueda.trim() === ''
    ? clientes
    : clientes.filter((cliente) => {
        const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`;
        const busquedaNormalizada = normalizarTexto(busqueda);
        const nombreNormalizado = normalizarTexto(nombreCompleto);
        return nombreNormalizado.includes(busquedaNormalizada);
      });

  return (
    <div className="admin-empleados-page">
      <div className="page-header">
        <div>
          <h1>👥 Gestión de Clientes</h1>
          <p className="subtitle">
            {busqueda.trim() === '' 
              ? `Total de usuarios: ${clientes.length}`
              : `Mostrando ${clientesFiltrados.length} de ${clientes.length} usuarios`
            }
          </p>
        </div>
        <div className="header-controls">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            {mostrarFormulario ? '✕ Cerrar' : '+ Nuevo Usuario'}
          </button>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="formulario-container">
          <h2>Crear Nuevo Usuario</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input
                  type="text"
                  className="form-input"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Ej: Pérez"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email (Usuario)</label>
                <input
                  type="text"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: juan.perez@restaurante.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="form-input"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: +56912345678"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setMostrarFormulario(false);
                  setNombre('');
                  setApellido('');
                  setTelefono('');
                  setEmail('');
                  setPassword('');
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creando}
              >
                {creando ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando clientes...</p>
        </div>
      ) : clientes.length === 0 ? (
        <div className="empty-state">
          <p>📭 No hay usuarios registrados</p>
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="empty-state">
          <p>🔍 No se encontraron clientes para la búsqueda ingresada</p>
        </div>
      ) : (
        <div className="empleados-grid">
          {clientesFiltrados.map((cliente) => (
            <div key={cliente.id} className="empleado-card-wrapper">
              <button
                className="empleado-card"
                onClick={() => setClienteSeleccionado(cliente)}
              >
                <div className="empleado-avatar">
                  {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
                </div>
                <div className="empleado-info">
                  <h3>{cliente.nombre} {cliente.apellido}</h3>
                  <p className="email">{cliente.email}</p>
                  <p className="fecha">
                    Desde: {formatearTimestampCorto(cliente.fechaCreacion)}
                  </p>
                  <p className="rol-badge">{getRolIcon(cliente.rol)} {cliente.rol}</p>
                </div>
              </button>
              {cliente.rol === 'CLIENTE' && (
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => handleEditarCliente(cliente)}
                  title="Editar cliente"
                >
                  ✏️ Editar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {clienteEnEdicion && (
        <div className="modal-overlay" onClick={cerrarEdicion}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Cliente</h2>
              <button className="modal-close" onClick={cerrarEdicion}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="edit-form-container">
                {erroresEdicion.length > 0 && (
                  <div className="errores-lista">
                    {erroresEdicion.map((error, idx) => (
                      <p key={idx} className="error-item">⚠️ {error}</p>
                    ))}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellido</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.apellido}
                      onChange={(e) => setEditForm({...editForm, apellido: e.target.value})}
                      placeholder="Apellido"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      placeholder="Email"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={editForm.telefono}
                      onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
                      placeholder="Teléfono"
                    />
                  </div>
                </div>

                <div className="info-nota">
                  <p>📝 Nota: No puedes cambiar la contraseña ni el rol desde aquí.</p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={handleGuardarEdicion}
                disabled={editando}
              >
                {editando ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
              <button className="btn btn-secondary" onClick={cerrarEdicion}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {clienteSeleccionado && (
        <div className="modal-overlay" onClick={cerrarDetalle}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Usuario</h2>
              <button className="modal-close" onClick={cerrarDetalle}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="detalle-avatar-grande">
                {clienteSeleccionado.nombre.charAt(0)}{clienteSeleccionado.apellido.charAt(0)}
              </div>
              
              <div className="detalle-campos">
                <div className="detalle-campo">
                  <label>Nombre Completo</label>
                  <p>{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</p>
                </div>
                
                <div className="detalle-campo">
                  <label>Email (Usuario)</label>
                  <p className="email-detalle">{clienteSeleccionado.email}</p>
                </div>
                
                <div className="detalle-campo">
                  <label>Teléfono</label>
                  <p>{clienteSeleccionado.telefono}</p>
                </div>
                
                <div className="detalle-campo">
                  <label>Rol</label>
                  <p className="rol-badge">{getRolIcon(clienteSeleccionado.rol)} {clienteSeleccionado.rol}</p>
                </div>
                
                <div className="detalle-campo">
                  <label>Fecha de Registro</label>
                  <p>{formatearTimestamp(clienteSeleccionado.fechaCreacion)}</p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              {clienteSeleccionado.rol === 'CLIENTE' && (
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    handleEditarCliente(clienteSeleccionado);
                    cerrarDetalle();
                  }}
                >
                  ✏️ Editar Cliente
                </button>
              )}
              <button 
                className="btn btn-danger"
                onClick={handleEliminarCliente}
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : '🗑️ Eliminar Cliente'}
              </button>
              <button className="btn btn-secondary" onClick={cerrarDetalle}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
