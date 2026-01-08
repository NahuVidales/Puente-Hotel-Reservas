import { useState, useEffect } from 'react';
import { empleadoService, Empleado } from '../../services/empleados.service';
import toast from 'react-hot-toast';
import { formatearTimestamp, formatearTimestampCorto } from '../../utils/helpers';
import './AdminPages.css';
import './AdminEmpleadosPage.css';

export function AdminEmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  
  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creando, setCreando] = useState(false);

  // Cargar empleados al montar
  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    setLoading(true);
    try {
      const data = await empleadoService.getEmpleados();
      setEmpleados(data);
      console.log('[AdminEmpleados] Empleados cargados:', data.length);
    } catch (error: any) {
      console.error('[AdminEmpleados] Error al cargar empleados:', error);
      toast.error('Error al cargar empleados');
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
      const response = await empleadoService.crearEmpleado({
        nombre,
        apellido,
        telefono,
        email,
        password
      });

      toast.success(response.mensaje);
      setEmpleados([response.empleado, ...empleados]);

      // Limpiar formulario
      setNombre('');
      setApellido('');
      setTelefono('');
      setEmail('');
      setPassword('');
      setMostrarFormulario(false);
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al crear empleado';
      toast.error(mensaje);
    } finally {
      setCreando(false);
    }
  };

  const cerrarDetalle = () => {
    setEmpleadoSeleccionado(null);
  };

  return (
    <div className="admin-empleados-page">
      <div className="page-header">
        <div>
          <h1>👥 Gestión de Empleados</h1>
          <p className="subtitle">Total de empleados: {empleados.length}</p>
        </div>
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? '✕ Cerrar' : '+ Nuevo Empleado'}
        </button>
      </div>

      {mostrarFormulario && (
        <div className="formulario-container">
          <h2>Crear Nuevo Empleado</h2>
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
                {creando ? 'Creando...' : 'Crear Empleado'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando empleados...</p>
        </div>
      ) : empleados.length === 0 ? (
        <div className="empty-state">
          <p>📭 No hay empleados registrados</p>
        </div>
      ) : (
        <div className="empleados-grid">
          {empleados.map((empleado) => (
            <button
              key={empleado.id}
              className="empleado-card"
              onClick={() => setEmpleadoSeleccionado(empleado)}
            >
              <div className="empleado-avatar">
                {empleado.nombre.charAt(0)}{empleado.apellido.charAt(0)}
              </div>
              <div className="empleado-info">
                <h3>{empleado.nombre} {empleado.apellido}</h3>
                <p className="email">{empleado.email}</p>
                <p className="fecha">
                  Desde: {formatearTimestampCorto(empleado.fechaCreacion)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {empleadoSeleccionado && (
        <div className="modal-overlay" onClick={cerrarDetalle}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Empleado</h2>
              <button className="modal-close" onClick={cerrarDetalle}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="detalle-avatar-grande">
                {empleadoSeleccionado.nombre.charAt(0)}{empleadoSeleccionado.apellido.charAt(0)}
              </div>
              
              <div className="detalle-campos">
                <div className="detalle-campo">
                  <label>Nombre Completo</label>
                  <p>{empleadoSeleccionado.nombre} {empleadoSeleccionado.apellido}</p>
                </div>
                
                <div className="detalle-campo">
                  <label>Email (Usuario)</label>
                  <p className="email-detalle">{empleadoSeleccionado.email}</p>
                </div>
                
                <div className="detalle-campo">
                  <label>Teléfono</label>
                  <p>{empleadoSeleccionado.telefono}</p>
                </div>
                
                <div className="detalle-campo">
                  <label>Rol</label>
                  <p className="rol-badge">👨‍💼 {empleadoSeleccionado.rol}</p>
                </div>
                
                <div className="detalle-campo">
                  <label>Fecha de Registro</label>
                  <p>{formatearTimestamp(empleadoSeleccionado.fechaCreacion)}</p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
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
