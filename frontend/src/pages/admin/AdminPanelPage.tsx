import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { reservaService } from '../../services/reserva.service';
import { parametrosService } from '../../services/otros.service';
import { Reserva, Turno, Planificacion, TURNOS, Zona } from '../../types';
import { fechaISO, formatearFecha, formatearFechaCorta, getNombreTurno, getNombreZona, getEstadoReserva, parsearFechaISO } from '../../utils/helpers';
import { OcupacionBar } from '../../components/OcupacionBar';
import toast from 'react-hot-toast';
import './AdminPages.css';

export function AdminPanelPage() {
  const [fecha, setFecha] = useState(fechaISO(new Date()));
  const [turno, setTurno] = useState<Turno>('ALMUERZO');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [planificacion, setPlanificacion] = useState<Planificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelarModal, setCancelarModal] = useState<number | null>(null);
  const [observacionesModal, setObservacionesModal] = useState<string | null>(null);
  const [zonaFiltro, setZonaFiltro] = useState<'TODAS' | Zona>('TODAS');
  const [modalReservas, setModalReservas] = useState(false);
  const [modalPersonas, setModalPersonas] = useState(false);
  const [modalOcupacion, setModalOcupacion] = useState(false);
  const [filtroZonaDetalle, setFiltroZonaDetalle] = useState<Zona | null>(null);
  const [filtroCantidadDetalle, setFiltroCantidadDetalle] = useState<number | null>(null);
  const detailTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cargarDatos();
  }, [fecha, turno]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [reservasData, planificacionData] = await Promise.all([
        reservaService.getTodasReservas({ fecha, turno }),
        reservaService.getPlanificacion(fecha, turno)
      ]);
      setReservas(reservasData);
      setPlanificacion(planificacionData);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id: number) => {
    try {
      await reservaService.cancelarReserva(id);
      toast.success('Reserva cancelada');
      setCancelarModal(null);
      cargarDatos();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cancelar');
    }
  };

  const cambiarFecha = (dias: number) => {
    const fechaActual = parsearFechaISO(fecha);
    fechaActual.setDate(fechaActual.getDate() + dias);
    setFecha(fechaISO(fechaActual));
  };

  const manejarClickDistribucion = (zona: Zona, cantidadPersonas: number) => {
    setFiltroZonaDetalle(zona);
    setFiltroCantidadDetalle(cantidadPersonas);
    
    // Desplazar a la tabla de detalle
    setTimeout(() => {
      detailTableRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const limpiarFiltrosDetalle = () => {
    setFiltroZonaDetalle(null);
    setFiltroCantidadDetalle(null);
  };

  const reservasFiltradas = filtroZonaDetalle && filtroCantidadDetalle 
    ? reservas.filter(r => r.zona === filtroZonaDetalle && r.cantidadPersonas === filtroCantidadDetalle)
    : reservas;

  return (
    <div className="page">
      <div className="container">
        <div className="admin-header">
          <h1>Panel de Reservas</h1>
          <Link to="/admin/nueva-reserva" className="btn btn-primary">
            + Crear Reserva
          </Link>
        </div>

        {/* Filtros */}
        <div className="filtros-container card">
          <div className="filtros-fecha">
            <button className="btn btn-secondary btn-sm" onClick={() => cambiarFecha(-1)}>
              ← Anterior
            </button>
            <div className="fecha-selector">
              <input
                type="date"
                className="form-input"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
              <span className="fecha-texto">{formatearFecha(fecha)}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => cambiarFecha(1)}>
              Siguiente →
            </button>
          </div>

          <div className="filtros-turno">
            {TURNOS.map((t) => (
              <button
                key={t.value}
                className={`btn ${turno === t.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTurno(t.value)}
              >
                {t.value === 'ALMUERZO' ? '☀️' : '🌙'} {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Resumen */}
            {planificacion && (
              <div className="resumen-grid">
                <div className="resumen-card card clickable" onClick={() => setModalOcupacion(true)}>
                  <h3>Ocupación Total</h3>
                  <OcupacionBar
                    porcentaje={planificacion.resumen.porcentajeOcupacion}
                    personasReservadas={planificacion.resumen.totalPersonas}
                    capacidadTotal={planificacion.resumen.capacidadTotal}
                  />
                </div>

                <div className="resumen-card card clickable" onClick={() => setModalReservas(true)}>
                  <h3>Reservas</h3>
                  <div className="resumen-numero">{planificacion.resumen.totalReservas}</div>
                  <p className="text-muted">
                    {planificacion.resumen.conObservaciones} con observaciones
                  </p>
                </div>

                <div className="resumen-card card clickable" onClick={() => setModalPersonas(true)}>
                  <h3>Personas</h3>
                  <div className="resumen-numero">{planificacion.resumen.totalPersonas}</div>
                  <p className="text-muted">
                    de {planificacion.resumen.capacidadTotal} lugares
                  </p>
                </div>
              </div>
            )}

            {/* Tabla de distribución por zona y tamaño */}
            {planificacion && (
              <div className="card mt-3">
                <div className="card-header">
                  <h3 className="card-title">Distribución de mesas</h3>
                  <div className="filtro-zona">
                    <select
                      value={zonaFiltro}
                      onChange={(e) => setZonaFiltro(e.target.value as 'TODAS' | Zona)}
                      className="form-input"
                    >
                      <option value="TODAS">Todas</option>
                      <option value="FRENTE">Frente</option>
                      <option value="GALERIA">Galería</option>
                      <option value="SALON">Salón</option>
                    </select>
                  </div>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Zona</th>
                        <th>Reservas</th>
                        <th>Personas</th>
                        <th>Con Obs.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtrados = planificacion.porZonaYTamano.filter(g => 
                          zonaFiltro === 'TODAS' || g.zona === zonaFiltro
                        );
                        
                        if (filtrados.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>
                                No hay datos para esta zona
                              </td>
                            </tr>
                          );
                        }
                        
                        return filtrados.map((grupo) => (
                          <tr 
                            key={`${grupo.zona}-${grupo.tamano}`}
                            className="clickable-row"
                            onClick={() => manejarClickDistribucion(grupo.zona, parseInt(grupo.tamano))}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{getNombreZona(grupo.zona)}</td>
                            <td>{grupo.reservas}</td>
                            <td>{grupo.personas}</td>
                            <td>{grupo.conObservaciones > 0 ? '✓' : '-'}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tabla de reservas detalladas */}
            <div className="card mt-3" ref={detailTableRef}>
              <div className="card-header">
                <h3 className="card-title">
                  Detalle de Reservas
                  {filtroZonaDetalle && filtroCantidadDetalle && (
                    <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '10px' }}>
                      (Filtrado: {getNombreZona(filtroZonaDetalle)} - {filtroCantidadDetalle} personas)
                    </span>
                  )}
                </h3>
                {(filtroZonaDetalle || filtroCantidadDetalle) && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={limpiarFiltrosDetalle}
                  >
                    Ver todas las reservas
                  </button>
                )}
              </div>

              {reservasFiltradas.length === 0 ? (
                <div className="empty-state-small">
                  <p>
                    {filtroZonaDetalle && filtroCantidadDetalle 
                      ? 'No hay reservas con este filtro'
                      : 'No hay reservas para este día y turno'}
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Personas</th>
                        <th>Zona</th>
                        <th>Obs.</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservasFiltradas.map((reserva) => {
                        const estadoInfo = getEstadoReserva(reserva.estado);
                        return (
                          <tr key={reserva.id}>
                            <td>
                              <div className="cliente-info">
                                <span className="cliente-nombre">
                                  {reserva.cliente?.nombre} {reserva.cliente?.apellido}
                                </span>
                                <span className="cliente-contacto">
                                  {reserva.cliente?.telefono}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="personas-badge">
                                {reserva.cantidadPersonas}
                              </span>
                            </td>
                            <td>{getNombreZona(reserva.zona)}</td>
                            <td>
                              {reserva.observaciones ? (
                                <button
                                  className="btn-observaciones"
                                  onClick={() => setObservacionesModal(reserva.observaciones!)}
                                  title="Ver observaciones"
                                >
                                  📝
                                </button>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>
                              <span className={`badge badge-${estadoInfo.color}`}>
                                {estadoInfo.texto}
                              </span>
                            </td>
                            <td>
                              <div className="acciones-grupo">
                                {reserva.estado === 'RESERVADA' && (
                                  <>
                                    <Link
                                      to={`/admin/editar-reserva/${reserva.id}`}
                                      className="btn btn-secondary btn-sm"
                                    >
                                      Editar
                                    </Link>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => setCancelarModal(reserva.id)}
                                    >
                                      Cancelar
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Comentarios de clientes */}
            {reservas.some(r => r.comentarios && r.comentarios.length > 0) && (
              <div className="card mt-3">
                <div className="card-header">
                  <h3 className="card-title">Comentarios de Clientes</h3>
                </div>
                <div className="comentarios-lista">
                  {reservas
                    .filter(r => r.comentarios && r.comentarios.length > 0)
                    .map((reserva) => (
                      <div key={reserva.id} className="comentario-item">
                        <div className="comentario-autor">
                          {reserva.cliente?.nombre} {reserva.cliente?.apellido}
                        </div>
                        <div className="comentario-texto">
                          "{reserva.comentarios![0].textoComentario}"
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal Cancelar */}
        {cancelarModal && (
          <div className="modal-overlay" onClick={() => setCancelarModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Cancelar Reserva</h3>
              </div>
              <div className="modal-body">
                <p>¿Confirmas la cancelación de esta reserva?</p>
                <p className="text-muted">El cliente será notificado.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setCancelarModal(null)}>
                  Volver
                </button>
                <button className="btn btn-danger" onClick={() => handleCancelar(cancelarModal)}>
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Observaciones */}
        {observacionesModal && (
          <div className="modal-overlay" onClick={() => setObservacionesModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Observaciones</h3>
              </div>
              <div className="modal-body">
                <p>{observacionesModal}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setObservacionesModal(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Reservas por Zona */}
        {modalReservas && planificacion && (
          <div className="modal-overlay" onClick={() => setModalReservas(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Reservas por Zona</h3>
              </div>
              <div className="modal-body">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Zona</th>
                        <th>Reservas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['FRENTE', 'GALERIA', 'SALON'].map((zona) => (
                        <tr key={zona}>
                          <td>{getNombreZona(zona as Zona)}</td>
                          <td>{planificacion.porZona[zona as Zona]?.reservas || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setModalReservas(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Personas por Zona */}
        {modalPersonas && planificacion && (
          <div className="modal-overlay" onClick={() => setModalPersonas(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Personas por Zona</h3>
              </div>
              <div className="modal-body">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Zona</th>
                        <th>Personas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['FRENTE', 'GALERIA', 'SALON'].map((zona) => (
                        <tr key={zona}>
                          <td>{getNombreZona(zona as Zona)}</td>
                          <td>{planificacion.porZona[zona as Zona]?.personas || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setModalPersonas(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ocupación por Zona */}
        {modalOcupacion && planificacion && (
          <div className="modal-overlay" onClick={() => setModalOcupacion(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Ocupación por Zona</h3>
              </div>
              <div className="modal-body">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Zona</th>
                        <th>Capacidad</th>
                        <th>Personas</th>
                        <th>% Ocupación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['FRENTE', 'GALERIA', 'SALON'].map((zona) => {
                        const capacidad = planificacion.capacidadPorZona[zona as Zona];
                        const personas = planificacion.porZona[zona as Zona]?.personas || 0;
                        const porcentaje = Math.round((personas / capacidad) * 100);
                        return (
                          <tr key={zona}>
                            <td>{getNombreZona(zona as Zona)}</td>
                            <td>{capacidad}</td>
                            <td>{personas}</td>
                            <td>{porcentaje}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setModalOcupacion(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
