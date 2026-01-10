import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservaService } from '../../services/reserva.service';
import { parametrosService, usuarioService } from '../../services/otros.service';
import { Usuario, Turno, Zona, TURNOS, ZONAS, Disponibilidad } from '../../types';
import { getDiasDisponibles, fechaISO, formatearFecha, validarCapacidadZona } from '../../utils/helpers';
import { OcupacionBar } from '../../components/OcupacionBar';
import toast from 'react-hot-toast';
import './AdminPages.css';
import '../cliente/NuevaReservaPage.css';

type ModoCliente = 'existente' | 'nuevo';

export function AdminNuevaReservaPage() {
  const navigate = useNavigate();

  // Modo de cliente
  const [modo, setModo] = useState<ModoCliente>('existente');

  // Estado para cliente existente
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Usuario | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<Usuario[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  // Estado para cliente nuevo
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  // Estado de reserva
  const [fecha, setFecha] = useState('');
  const [turno, setTurno] = useState<Turno | ''>('');
  const [zona, setZona] = useState<Zona | ''>('');
  const [cantidadPersonas, setCantidadPersonas] = useState(2);
  const [observaciones, setObservaciones] = useState('');

  const [diasDisponibles, setDiasDisponibles] = useState<Date[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarParametros();
  }, []);

  useEffect(() => {
    if (fecha && turno) {
      cargarDisponibilidad();
    }
  }, [fecha, turno]);

  useEffect(() => {
    if (busquedaCliente.length >= 2) {
      buscarClientes();
    } else {
      setClientesEncontrados([]);
      setMostrarDropdown(false);
    }
  }, [busquedaCliente]);

  // Limpiar errores cuando el usuario cambia el email
  useEffect(() => {
    setEmailError('');
  }, [email]);

  const cargarParametros = async () => {
    try {
      const params = await parametrosService.getParametros();
      const dias = getDiasDisponibles(params.anticipacionMaximaDias);
      setDiasDisponibles(dias);
    } catch (error) {
      toast.error('Error al cargar configuración');
    }
  };

  const cargarDisponibilidad = async () => {
    if (!fecha || !turno) return;
    try {
      const data = await reservaService.getDisponibilidad(fecha, turno as Turno);
      setDisponibilidad(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const buscarClientes = async () => {
    try {
      const clientes = await usuarioService.buscarClientes(busquedaCliente);
      setClientesEncontrados(clientes);
      setMostrarDropdown(true);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
    }
  };

  const seleccionarCliente = (cliente: Usuario) => {
    setClienteId(cliente.id);
    setClienteSeleccionado(cliente);
    setBusquedaCliente('');
    setMostrarDropdown(false);
  };

  const validarFormularioClienteNuevo = (): boolean => {
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return false;
    }
    if (!apellido.trim()) {
      toast.error('El apellido es obligatorio');
      return false;
    }
    if (!telefono.trim()) {
      toast.error('El teléfono es obligatorio');
      return false;
    }
    if (!email.trim()) {
      toast.error('El email es obligatorio');
      return false;
    }
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('El email debe ser válido (ejemplo: usuario@dominio.com)');
      return false;
    }
    if (!password.trim()) {
      toast.error('La contraseña es obligatoria');
      return false;
    }
    if (password.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones comunes
    if (!fecha || !turno || !zona) {
      toast.error('Completa todos los campos de reserva');
      return;
    }
    if (cantidadPersonas < 1) {
      toast.error('La cantidad de personas debe ser al menos 1');
      return;
    }

    // Validar capacidad de la zona
    if (disponibilidad) {
      const disponiblesEnZona = disponibilidad.ocupacion.porZona[zona as Zona].disponibles;
      const validacion = validarCapacidadZona(cantidadPersonas, disponiblesEnZona, zona as Zona);
      
      if (!validacion.valido) {
        toast.error(validacion.mensaje || 'Error de validación');
        return;
      }
    }

    // Validaciones específicas según modo
    if (modo === 'existente') {
      if (!clienteId) {
        toast.error('Selecciona un cliente');
        return;
      }

      setLoading(true);
      try {
        await reservaService.crearReserva({
          clienteId,
          fecha,
          turno: turno as Turno,
          zona: zona as Zona,
          cantidadPersonas,
          observaciones: observaciones.trim() || undefined
        });

        toast.success('Reserva creada correctamente');
        navigate('/admin');
      } catch (error: any) {
        const mensaje = error.response?.data?.error || error.response?.data?.mensaje || 'Error al crear reserva';
        toast.error(mensaje);
      } finally {
        setLoading(false);
      }
    } else {
      // Modo nuevo
      if (!validarFormularioClienteNuevo()) {
        return;
      }

      setLoading(true);
      try {
        await reservaService.crearClienteYReserva({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefono: telefono.trim(),
          email: email.trim(),
          password,
          fecha,
          turno: turno as Turno,
          zona: zona as Zona,
          cantidadPersonas,
          observaciones: observaciones.trim() || undefined
        });

        toast.success('Reserva creada correctamente');
        navigate('/admin');
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'Error al crear cliente y reserva';
        
        // Si el error es por email duplicado, mostrar en el campo
        if (errorMsg.includes('email') || errorMsg.includes('ya existe')) {
          setEmailError(errorMsg);
          toast.error('El email ya existe. Elegí uno diferente.');
        } else {
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="nueva-reserva-container">
          <div className="nueva-reserva-header">
            <h1>Crear Reserva Manual</h1>
            <p>Crear una nueva reserva desde el panel interno</p>
          </div>

          {/* Selector de modo */}
          <div className="modo-selector-container">
            <div className="modo-selector">
              <button
                type="button"
                className={`modo-btn ${modo === 'existente' ? 'activo' : ''}`}
                onClick={() => {
                  setModo('existente');
                  setClienteId(null);
                  setClienteSeleccionado(null);
                  setBusquedaCliente('');
                }}
              >
                <span className="modo-icon">👤</span>
                <span className="modo-title">Cliente Existente</span>
                <span className="modo-desc">Selecciona un cliente registrado</span>
              </button>

              <button
                type="button"
                className={`modo-btn ${modo === 'nuevo' ? 'activo' : ''}`}
                onClick={() => {
                  setModo('nuevo');
                  setNombre('');
                  setApellido('');
                  setTelefono('');
                  setEmail('');
                  setPassword('');
                  setEmailError('');
                }}
              >
                <span className="modo-icon">➕</span>
                <span className="modo-title">Cliente Nuevo</span>
                <span className="modo-desc">Crea un cliente y su reserva</span>
              </button>
            </div>
          </div>

          <div className="nueva-reserva-card card">
            <form onSubmit={handleSubmit} className="paso-content">
              {/* SECCIÓN 1: Datos del cliente */}
              <div className="form-section">
                <h3>Datos del Cliente</h3>

                {modo === 'existente' ? (
                  // Cliente existente
                  <div className="form-group">
                    <label className="form-label">Selecciona un cliente</label>
                    {clienteSeleccionado ? (
                      <div className="cliente-seleccionado">
                        <div>
                          <strong>{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</strong>
                          <br />
                          <small className="text-muted">{clienteSeleccionado.email} • {clienteSeleccionado.telefono}</small>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setClienteId(null);
                            setClienteSeleccionado(null);
                          }}
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <div className="cliente-selector">
                        <input
                          type="text"
                          className="form-input"
                          value={busquedaCliente}
                          onChange={(e) => setBusquedaCliente(e.target.value)}
                          placeholder="Buscar por nombre, email..."
                          onFocus={() => busquedaCliente.length >= 2 && setMostrarDropdown(true)}
                          autoFocus
                        />
                        {mostrarDropdown && clientesEncontrados.length > 0 && (
                          <div className="cliente-dropdown">
                            {clientesEncontrados.map((cliente) => (
                              <div
                                key={cliente.id}
                                className="cliente-option"
                                onClick={() => seleccionarCliente(cliente)}
                              >
                                <strong>{cliente.nombre} {cliente.apellido}</strong>
                                <br />
                                <small>{cliente.email}</small>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Cliente nuevo
                  <>
                    <div className="form-group">
                      <label className="form-label">Nombre *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre del cliente"
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Apellido *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        placeholder="Apellido del cliente"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Teléfono *</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Teléfono de contacto"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email (usuario para login) *</label>
                      <input
                        type="email"
                        className={`form-input ${emailError ? 'error' : ''}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@dominio.com"
                      />
                      {emailError && (
                        <small className="form-error">{emailError}</small>
                      )}
                      <small className="form-help">Email único. Será usado para el login del cliente.</small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Contraseña *</label>
                      <input
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña (mín. 4 caracteres)"
                      />
                      <small className="form-help">Mínimo 4 caracteres</small>
                    </div>
                  </>
                )}
              </div>

              {/* SECCIÓN 2: Datos de la reserva */}
              <div className="form-section">
                <h3>Datos de la Reserva</h3>

                {/* Fecha */}
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <select
                    className="form-select"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  >
                    <option value="">Selecciona una fecha</option>
                    {diasDisponibles.map((dia) => (
                      <option key={fechaISO(dia)} value={fechaISO(dia)}>
                        {formatearFecha(dia)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Turno */}
                <div className="form-group">
                  <label className="form-label">Turno *</label>
                  <div className="turnos-grid">
                    {TURNOS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        className={`turno-btn ${turno === t.value ? 'seleccionado' : ''}`}
                        onClick={() => setTurno(t.value)}
                      >
                        <span className="turno-icon">{t.value === 'ALMUERZO' ? '☀️' : '🌙'}</span>
                        <span className="turno-nombre">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disponibilidad */}
                {disponibilidad && (
                  <div className="disponibilidad-detalle">
                    <OcupacionBar
                      porcentaje={disponibilidad.ocupacion.porcentajeOcupacion}
                      personasReservadas={disponibilidad.ocupacion.personasReservadas}
                      capacidadTotal={disponibilidad.capacidad.total}
                    />
                  </div>
                )}

                {/* Cantidad */}
                <div className="form-group">
                  <label className="form-label">Cantidad de personas *</label>
                  <div className="cantidad-selector">
                    <button
                      type="button"
                      className="cantidad-btn"
                      onClick={() => setCantidadPersonas(Math.max(1, cantidadPersonas - 1))}
                    >
                      -
                    </button>
                    <span className="cantidad-valor">{cantidadPersonas}</span>
                    <button
                      type="button"
                      className="cantidad-btn"
                      onClick={() => setCantidadPersonas(Math.min(50, cantidadPersonas + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Zona */}
                <div className="form-group">
                  <label className="form-label">Zona *</label>
                  <div className="zonas-grid">
                    {ZONAS.map((z) => {
                      const zonaDisp = disponibilidad?.ocupacion.porZona[z.value];
                      return (
                        <button
                          key={z.value}
                          type="button"
                          className={`zona-btn ${zona === z.value ? 'seleccionado' : ''}`}
                          onClick={() => setZona(z.value)}
                        >
                          <span className="zona-nombre">{z.label}</span>
                          {zonaDisp && (
                            <span className="zona-disponible">
                              {zonaDisp.disponibles} disponibles
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Observaciones */}
                <div className="form-group">
                  <label className="form-label">Observaciones (opcional)</label>
                  <textarea
                    className="form-textarea"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Observaciones especiales, restricciones, etc."
                    rows={3}
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/admin')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading || !fecha || !turno || !zona || (modo === 'existente' && !clienteId)}
                >
                  {loading ? 'Creando...' : 'Crear Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .modo-selector-container {
          margin-bottom: 2rem;
        }

        .modo-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .modo-btn {
          padding: 1.5rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-align: center;
        }

        .modo-btn:hover {
          border-color: #d0d0d0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .modo-btn.activo {
          border-color: #8b5a3c;
          background: #f5f0ea;
          box-shadow: 0 4px 12px rgba(139, 90, 60, 0.2);
        }

        .modo-icon {
          font-size: 2rem;
        }

        .modo-title {
          font-weight: 600;
          font-size: 1rem;
          color: #333;
        }

        .modo-desc {
          font-size: 0.85rem;
          color: #666;
        }

        .form-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .form-section h3 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #333;
          font-size: 1.1rem;
        }

        .form-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .form-error {
          display: block;
          color: #d32f2f;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .form-help {
          display: block;
          color: #999;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .form-input.error,
        .form-select.error {
          border-color: #d32f2f;
        }

        .cliente-seleccionado {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .cliente-seleccionado .btn-sm {
          margin-left: 1rem;
          flex-shrink: 0;
        }

        .text-muted {
          color: #666;
        }
      `}</style>
    </div>
  );
}
