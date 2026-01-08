import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reservaService } from '../../services/reserva.service';
import { parametrosService } from '../../services/otros.service';
import { Reserva, Turno, Zona, TURNOS, ZONAS, Disponibilidad } from '../../types';
import { getDiasDisponibles, fechaISO, formatearFecha, validarCapacidadZona } from '../../utils/helpers';
import { OcupacionBar } from '../../components/OcupacionBar';
import toast from 'react-hot-toast';
import './NuevaReservaPage.css';

export function EditarReservaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [fecha, setFecha] = useState('');
  const [turno, setTurno] = useState<Turno | ''>('');
  const [zona, setZona] = useState<Zona | ''>('');
  const [cantidadPersonas, setCantidadPersonas] = useState(2);
  const [observaciones, setObservaciones] = useState('');
  
  const [diasDisponibles, setDiasDisponibles] = useState<Date[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  useEffect(() => {
    if (fecha && turno) {
      cargarDisponibilidad();
    }
  }, [fecha, turno]);

  const cargarDatos = async () => {
    try {
      const [reservaData, parametros] = await Promise.all([
        reservaService.getReserva(parseInt(id!)),
        parametrosService.getParametros()
      ]);

      if (!reservaData.puedeModificar) {
        toast.error('Esta reserva no se puede modificar');
        navigate('/cliente/mis-reservas');
        return;
      }

      setReserva(reservaData);
      setFecha(reservaData.fecha.split('T')[0]);
      setTurno(reservaData.turno);
      setZona(reservaData.zona);
      setCantidadPersonas(reservaData.cantidadPersonas);
      setObservaciones(reservaData.observaciones || '');
      
      const dias = getDiasDisponibles(parametros.anticipacionMaximaDias);
      setDiasDisponibles(dias);
    } catch (error) {
      toast.error('Error al cargar la reserva');
      navigate('/cliente/mis-reservas');
    } finally {
      setLoading(false);
    }
  };

  const cargarDisponibilidad = async () => {
    if (!fecha || !turno) return;
    
    try {
      const data = await reservaService.getDisponibilidad(fecha, turno as Turno);
      setDisponibilidad(data);
    } catch (error) {
      console.error('Error al cargar disponibilidad:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!zona || !turno) {
      toast.error('Completa todos los campos');
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

    setGuardando(true);
    try {
      await reservaService.actualizarReserva(parseInt(id!), {
        fecha,
        turno: turno as Turno,
        zona: zona as Zona,
        cantidadPersonas,
        observaciones: observaciones.trim() || undefined
      });
      
      toast.success('Reserva actualizada');
      navigate('/cliente/mis-reservas');
    } catch (error: any) {
      const mensaje = error.response?.data?.error || error.response?.data?.mensaje || 'Error al actualizar reserva';
      toast.error(mensaje);

      // Si hay detalles de capacidad, mostrarlos
      if (error.response?.data?.detalles) {
        const { lugaresDisponibles } = error.response.data.detalles;
        if (lugaresDisponibles !== undefined) {
          toast.error(`Lugares disponibles en la zona: ${lugaresDisponibles}`, { duration: 5000 });
        }
      }
      toast.error(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="nueva-reserva-container">
          <div className="nueva-reserva-header">
            <h1>Editar Reserva</h1>
            <p>Modifica los datos de tu reserva</p>
          </div>

          <div className="nueva-reserva-card card">
            <form onSubmit={handleSubmit} className="paso-content">
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <select
                  className="form-select"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                >
                  {diasDisponibles.map((dia) => (
                    <option key={fechaISO(dia)} value={fechaISO(dia)}>
                      {formatearFecha(dia)}
                    </option>
                  ))}
                </select>
              </div>

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
                  onClick={() => navigate('/cliente/mis-reservas')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
