import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservaService } from '../../services/reserva.service';
import { parametrosService, usuarioService } from '../../services/otros.service';
import { Usuario, Turno, Zona, TURNOS, ZONAS, Disponibilidad } from '../../types';
import { getDiasDisponibles, fechaISO, formatearFecha } from '../../utils/helpers';
import { OcupacionBar } from '../../components/OcupacionBar';
import toast from 'react-hot-toast';
import './AdminPages.css';
import '../cliente/NuevaReservaPage.css';

export function AdminNuevaReservaPage() {
  const navigate = useNavigate();

  // Estado del formulario
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Usuario | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<Usuario[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteId) {
      toast.error('Selecciona un cliente');
      return;
    }
    if (!fecha || !turno || !zona) {
      toast.error('Completa todos los campos');
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

      toast.success('Reserva creada exitosamente');
      navigate('/admin');
    } catch (error: any) {
      const mensaje = error.response?.data?.mensaje || error.response?.data?.error || 'Error al crear reserva';
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="nueva-reserva-container">
          <div className="nueva-reserva-header">
            <h1>Crear Reserva Manual</h1>
            <p>Crear una reserva para un cliente existente</p>
          </div>

          <div className="nueva-reserva-card card">
            <form onSubmit={handleSubmit} className="paso-content">
              {/* Selector de cliente */}
              <div className="form-group">
                <label className="form-label">Cliente</label>
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
                      placeholder="Buscar por nombre o email..."
                      onFocus={() => busquedaCliente.length >= 2 && setMostrarDropdown(true)}
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

              {/* Fecha */}
              <div className="form-group">
                <label className="form-label">Fecha</label>
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
                <label className="form-label">Turno</label>
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
                <label className="form-label">Cantidad de personas</label>
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
                <label className="form-label">Zona</label>
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
                  placeholder="Observaciones especiales..."
                  rows={3}
                />
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
                  disabled={loading || !clienteId || !fecha || !turno || !zona}
                >
                  {loading ? 'Creando...' : 'Crear Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
