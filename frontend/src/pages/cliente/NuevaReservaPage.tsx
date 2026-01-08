import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservaService } from '../../services/reserva.service';
import { parametrosService } from '../../services/otros.service';
import { OcupacionBar } from '../../components/OcupacionBar';
import { Turno, Zona, Disponibilidad, TURNOS, ZONAS } from '../../types';
import { getDiasDisponibles, fechaISO, formatearFecha, getNombreZona, validarCapacidadZona } from '../../utils/helpers';
import toast from 'react-hot-toast';
import './NuevaReservaPage.css';

export function NuevaReservaPage() {
  const navigate = useNavigate();
  
  // Estado del formulario
  const [paso, setPaso] = useState(1);
  const [fecha, setFecha] = useState('');
  const [turno, setTurno] = useState<Turno | ''>('');
  const [zona, setZona] = useState<Zona | ''>('');
  const [cantidadPersonas, setCantidadPersonas] = useState(2);
  const [observaciones, setObservaciones] = useState('');
  
  // Estado de datos
  const [diasDisponibles, setDiasDisponibles] = useState<Date[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);

  // Cargar días disponibles al montar
  useEffect(() => {
    const cargarParametros = async () => {
      try {
        const params = await parametrosService.getParametros();
        const dias = getDiasDisponibles(params.anticipacionMaximaDias);
        setDiasDisponibles(dias);
      } catch (error) {
        console.error('Error al cargar parámetros:', error);
        toast.error('Error al cargar configuración');
      }
    };
    cargarParametros();
  }, []);

  // Cargar disponibilidad cuando se selecciona fecha y turno
  useEffect(() => {
    if (fecha && turno) {
      cargarDisponibilidad();
    }
  }, [fecha, turno]);

  const cargarDisponibilidad = async () => {
    if (!fecha || !turno) return;
    
    console.log('[NuevaReserva] Cargando disponibilidad para:', { fecha, turno });
    
    setLoadingDisponibilidad(true);
    try {
      const data = await reservaService.getDisponibilidad(fecha, turno as Turno);
      console.log('[NuevaReserva] Disponibilidad cargada:', data);
      setDisponibilidad(data);
    } catch (error: any) {
      console.error('[NuevaReserva] Error al cargar disponibilidad:', error);
      const mensaje = error.response?.data?.error || 'Error al cargar disponibilidad';
      toast.error(mensaje);
      setDisponibilidad(null);
    } finally {
      setLoadingDisponibilidad(false);
    }
  };

  const handleSiguiente = () => {
    if (paso === 1) {
      if (!fecha) {
        toast.error('Selecciona una fecha');
        return;
      }
      if (!turno) {
        toast.error('Selecciona un turno');
        return;
      }
      setPaso(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!zona) {
      toast.error('Selecciona una zona');
      return;
    }
    if (cantidadPersonas < 1) {
      toast.error('La cantidad de personas debe ser al menos 1');
      return;
    }

    // Validar capacidad de la zona antes de enviar
    if (disponibilidad) {
      const disponiblesEnZona = disponibilidad.ocupacion.porZona[zona as Zona].disponibles;
      const validacion = validarCapacidadZona(cantidadPersonas, disponiblesEnZona, zona as Zona);
      
      if (!validacion.valido) {
        toast.error(validacion.mensaje || 'Error de validación');
        return;
      }
    }

    setLoading(true);
    try {
      await reservaService.crearReserva({
        fecha,
        turno: turno as Turno,
        zona: zona as Zona,
        cantidadPersonas,
        observaciones: observaciones.trim() || undefined
      });
      
      toast.success('¡Reserva creada exitosamente!');
      navigate('/cliente/mis-reservas');
    } catch (error: any) {
      const mensaje = error.response?.data?.error || error.response?.data?.mensaje || 'Error al crear reserva';
      toast.error(mensaje);
      
      // Si hay detalles de capacidad, mostrarlos
      if (error.response?.data?.detalles) {
        const { lugaresDisponibles } = error.response.data.detalles;
        if (lugaresDisponibles !== undefined) {
          toast.error(`Lugares disponibles en la zona: ${lugaresDisponibles}`, { duration: 5000 });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="nueva-reserva-container">
          <div className="nueva-reserva-header">
            <h1>Nueva Reserva</h1>
            <p>Selecciona la fecha y el turno para tu reserva</p>
          </div>

          {/* Indicador de pasos */}
          <div className="pasos-indicador">
            <div className={`paso ${paso >= 1 ? 'activo' : ''} ${paso > 1 ? 'completado' : ''}`}>
              <span className="paso-numero">1</span>
              <span className="paso-texto">Fecha y Turno</span>
            </div>
            <div className="paso-linea"></div>
            <div className={`paso ${paso >= 2 ? 'activo' : ''}`}>
              <span className="paso-numero">2</span>
              <span className="paso-texto">Detalles</span>
            </div>
          </div>

          <div className="nueva-reserva-card card">
            {paso === 1 && (
              <div className="paso-content">
                <div className="form-group">
                  <label className="form-label">Selecciona el día</label>
                  <div className="dias-grid">
                    {diasDisponibles.slice(0, 14).map((dia) => (
                      <button
                        key={fechaISO(dia)}
                        type="button"
                        className={`dia-btn ${fecha === fechaISO(dia) ? 'seleccionado' : ''}`}
                        onClick={() => setFecha(fechaISO(dia))}
                      >
                        <span className="dia-nombre">
                          {dia.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </span>
                        <span className="dia-numero">{dia.getDate()}</span>
                        <span className="dia-mes">
                          {dia.toLocaleDateString('es-ES', { month: 'short' })}
                        </span>
                      </button>
                    ))}
                  </div>
                  {diasDisponibles.length > 14 && (
                    <select 
                      className="form-select mt-2"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    >
                      <option value="">Ver más fechas...</option>
                      {diasDisponibles.slice(14).map((dia) => (
                        <option key={fechaISO(dia)} value={fechaISO(dia)}>
                          {formatearFecha(dia)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Selecciona el turno</label>
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

                {/* Mostrar disponibilidad si se seleccionó fecha y turno */}
                {loadingDisponibilidad ? (
                  <div className="loading">
                    <div className="spinner"></div>
                  </div>
                ) : disponibilidad && (
                  <div className="disponibilidad-preview">
                    <h4>Disponibilidad para este turno</h4>
                    <OcupacionBar
                      porcentaje={disponibilidad.ocupacion.porcentajeOcupacion}
                      personasReservadas={disponibilidad.ocupacion.personasReservadas}
                      capacidadTotal={disponibilidad.capacidad.total}
                    />
                    <p className="disponibilidad-info">
                      {disponibilidad.ocupacion.lugaresDisponibles} lugares disponibles
                    </p>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handleSiguiente}
                    disabled={!fecha || !turno}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {paso === 2 && (
              <form onSubmit={handleSubmit} className="paso-content">
                <div className="resumen-seleccion">
                  <p>
                    <strong>Fecha:</strong> {formatearFecha(fecha)}
                  </p>
                  <p>
                    <strong>Turno:</strong> {TURNOS.find(t => t.value === turno)?.label}
                  </p>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPaso(1)}
                  >
                    Cambiar
                  </button>
                </div>

                {disponibilidad && (
                  <div className="disponibilidad-detalle">
                    <OcupacionBar
                      porcentaje={disponibilidad.ocupacion.porcentajeOcupacion}
                      personasReservadas={disponibilidad.ocupacion.personasReservadas}
                      capacidadTotal={disponibilidad.capacidad.total}
                    />
                  </div>
                )}

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

                <div className="form-group">
                  <label className="form-label">Zona preferida</label>
                  <div className="zonas-grid">
                    {ZONAS.map((z) => {
                      const zonaDisp = disponibilidad?.ocupacion.porZona[z.value];
                      const puedoSeleccionar = !disponibilidad || (zonaDisp && zonaDisp.disponibles > 0);
                      return (
                        <button
                          key={z.value}
                          type="button"
                          className={`zona-btn ${zona === z.value ? 'seleccionado' : ''} ${!puedoSeleccionar ? 'deshabilitada' : ''}`}
                          onClick={() => puedoSeleccionar && setZona(z.value)}
                          disabled={!puedoSeleccionar}
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

                <div className="form-group">
                  <label className="form-label">Observaciones (opcional)</label>
                  <textarea
                    className="form-textarea"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Ej: Cumpleaños, alergias alimentarias, silla para bebé..."
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPaso(1)}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading || !zona}
                  >
                    {loading ? 'Reservando...' : 'Confirmar Reserva'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
