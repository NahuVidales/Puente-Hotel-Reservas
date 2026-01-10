import api from './api';
import { Reserva, ReservaForm, Disponibilidad, Turno, Planificacion, EstadoReserva } from '../types';

export const reservaService = {
  // Obtener disponibilidad para fecha y turno
  async getDisponibilidad(fecha: string, turno: Turno): Promise<Disponibilidad> {
    console.log('[ReservaService] getDisponibilidad - Parámetros:', { fecha, turno, tipoTurno: typeof turno });
    try {
      const response = await api.get('/reservas/disponibilidad', {
        params: { fecha, turno }
      });
      console.log('[ReservaService] getDisponibilidad - Respuesta:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ReservaService] getDisponibilidad - Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Crear nueva reserva
  async crearReserva(datos: ReservaForm): Promise<{ mensaje: string; reserva: Reserva }> {
    const response = await api.post('/reservas', datos);
    return response.data;
  },

  // Obtener reservas del cliente actual
  async getMisReservas(tipo?: 'futuras' | 'pasadas' | 'todas'): Promise<Reserva[]> {
    const response = await api.get('/reservas/mis-reservas', {
      params: { tipo }
    });
    return response.data.reservas;
  },

  // Obtener una reserva por ID
  async getReserva(id: number): Promise<Reserva> {
    const response = await api.get(`/reservas/${id}`);
    return response.data.reserva;
  },

  // Actualizar reserva
  async actualizarReserva(id: number, datos: Partial<ReservaForm>): Promise<{ mensaje: string; reserva: Reserva }> {
    const response = await api.put(`/reservas/${id}`, datos);
    return response.data;
  },

  // Cancelar reserva
  async cancelarReserva(id: number): Promise<{ mensaje: string; reserva: Reserva }> {
    const response = await api.put(`/reservas/${id}/cancelar`);
    return response.data;
  },

  // Crear cliente nuevo + reserva (operación atómica)
  async crearClienteYReserva(datos: {
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    password: string;
    fecha: string;
    turno: string;
    zona: string;
    cantidadPersonas: number;
    observaciones?: string;
  }): Promise<{ mensaje: string; cliente: any; reserva: Reserva }> {
    const response = await api.post('/reservas/con-cliente-nuevo', datos);
    return response.data;
  },

  // ===== RUTAS ADMIN =====

  // Obtener todas las reservas (admin)
  async getTodasReservas(filtros?: { fecha?: string; turno?: Turno; estado?: EstadoReserva }): Promise<Reserva[]> {
    const response = await api.get('/reservas/admin/todas', { params: filtros });
    return response.data.reservas;
  },

  // Obtener planificación (admin)
  async getPlanificacion(fecha: string, turno: Turno): Promise<Planificacion> {
    const response = await api.get('/reservas/admin/planificacion', {
      params: { fecha, turno }
    });
    return response.data;
  },
};
