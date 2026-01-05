import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reservaService } from '../../services/reserva.service';
import { comentarioService } from '../../services/otros.service';
import { Reserva } from '../../types';
import { formatearFecha, getNombreTurno, getNombreZona, getEstadoReserva } from '../../utils/helpers';
import toast from 'react-hot-toast';
import './MisReservasPage.css';

export function MisReservasPage() {
  const [tab, setTab] = useState<'futuras' | 'pasadas'>('futuras');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [comentarioModal, setComentarioModal] = useState<{ reservaId: number; texto: string } | null>(null);
  const [cancelarModal, setCancelarModal] = useState<number | null>(null);

  useEffect(() => {
    cargarReservas();
  }, [tab]);

  const cargarReservas = async () => {
    setLoading(true);
    try {
      const data = await reservaService.getMisReservas(tab);
      setReservas(data);
    } catch (error) {
      toast.error('Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id: number) => {
    try {
      await reservaService.cancelarReserva(id);
      toast.success('Reserva cancelada');
      setCancelarModal(null);
      cargarReservas();
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al cancelar reserva';
      toast.error(mensaje);
    }
  };

  const handleGuardarComentario = async () => {
    if (!comentarioModal) return;
    
    try {
      await comentarioService.guardarComentario(comentarioModal.reservaId, comentarioModal.texto);
      toast.success('Comentario guardado');
      setComentarioModal(null);
      cargarReservas();
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al guardar comentario';
      toast.error(mensaje);
    }
  };

  const abrirComentarioModal = (reserva: Reserva) => {
    const comentarioExistente = reserva.comentarios?.[0]?.textoComentario || '';
    setComentarioModal({ reservaId: reserva.id, texto: comentarioExistente });
  };

  return (
    <div className="page">
      <div className="container">
        <div className="mis-reservas-header">
          <h1>Mis Reservas</h1>
          <Link to="/cliente/nueva-reserva" className="btn btn-primary">
            + Nueva Reserva
          </Link>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${tab === 'futuras' ? 'activo' : ''}`}
            onClick={() => setTab('futuras')}
          >
            Próximas
          </button>
          <button
            className={`tab ${tab === 'pasadas' ? 'activo' : ''}`}
            onClick={() => setTab('pasadas')}
          >
            Historial
          </button>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reservas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📅</span>
            <h3>{tab === 'futuras' ? 'No tienes reservas próximas' : 'No tienes reservas anteriores'}</h3>
            {tab === 'futuras' && (
              <Link to="/cliente/nueva-reserva" className="btn btn-primary">
                Hacer una reserva
              </Link>
            )}
          </div>
        ) : (
          <div className="reservas-lista">
            {reservas.map((reserva) => {
              const estadoInfo = getEstadoReserva(reserva.estado);
              
              return (
                <div key={reserva.id} className="reserva-card card">
                  <div className="reserva-header">
                    <div className="reserva-fecha">
                      <span className="fecha-dia">
                        {new Date(reserva.fecha).getDate()}
                      </span>
                      <span className="fecha-mes">
                        {new Date(reserva.fecha).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="reserva-info">
                      <h3>{formatearFecha(reserva.fecha)}</h3>
                      <p className="reserva-turno">
                        {getNombreTurno(reserva.turno)} • {reserva.cantidadPersonas} personas • {getNombreZona(reserva.zona)}
                      </p>
                    </div>
                    <span className={`badge badge-${estadoInfo.color}`}>
                      {estadoInfo.texto}
                    </span>
                  </div>

                  {reserva.observaciones && (
                    <div className="reserva-observaciones">
                      <strong>Observaciones:</strong> {reserva.observaciones}
                    </div>
                  )}

                  {/* Comentarios para reservas pasadas */}
                  {tab === 'pasadas' && reserva.estado === 'RESERVADA' && (
                    <div className="reserva-comentario">
                      {reserva.comentarios && reserva.comentarios.length > 0 ? (
                        <>
                          <p className="comentario-texto">
                            "{reserva.comentarios[0].textoComentario}"
                          </p>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => abrirComentarioModal(reserva)}
                          >
                            Editar comentario
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => abrirComentarioModal(reserva)}
                        >
                          Dejar un comentario
                        </button>
                      )}
                    </div>
                  )}

                  {/* Acciones para reservas futuras */}
                  {tab === 'futuras' && reserva.estado === 'RESERVADA' && (
                    <div className="reserva-acciones">
                      {reserva.puedeModificar ? (
                        <>
                          <Link 
                            to={`/cliente/editar-reserva/${reserva.id}`}
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
                      ) : (
                        <p className="aviso-24h">
                          ⚠️ No se puede modificar con menos de 24h de anticipación
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Cancelar */}
        {cancelarModal && (
          <div className="modal-overlay" onClick={() => setCancelarModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Cancelar Reserva</h3>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas cancelar esta reserva?</p>
                <p className="text-muted">Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setCancelarModal(null)}
                >
                  Volver
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleCancelar(cancelarModal)}
                >
                  Sí, cancelar reserva
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Comentario */}
        {comentarioModal && (
          <div className="modal-overlay" onClick={() => setComentarioModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Tu Comentario</h3>
              </div>
              <div className="modal-body">
                <p>Cuéntanos cómo fue tu experiencia</p>
                <textarea
                  className="form-textarea"
                  value={comentarioModal.texto}
                  onChange={(e) => setComentarioModal({
                    ...comentarioModal,
                    texto: e.target.value
                  })}
                  placeholder="Escribe tu comentario aquí..."
                  rows={4}
                />
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setComentarioModal(null)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleGuardarComentario}
                  disabled={!comentarioModal.texto.trim()}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
