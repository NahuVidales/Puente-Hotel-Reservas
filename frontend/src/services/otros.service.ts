import api from './api';
import { ParametrosCapacidad, Usuario } from '../types';

export const parametrosService = {
  // Obtener parámetros de capacidad
  async getParametros(): Promise<ParametrosCapacidad> {
    const response = await api.get('/parametros');
    return response.data.parametros;
  },

  // Actualizar parámetros (solo admin)
  async actualizarParametros(datos: Partial<ParametrosCapacidad>): Promise<ParametrosCapacidad> {
    const response = await api.put('/parametros', datos);
    return response.data.parametros;
  },
};

export const usuarioService = {
  // Obtener todos los clientes (solo admin)
  async getClientes(): Promise<Usuario[]> {
    const response = await api.get('/usuarios');
    return response.data.usuarios;
  },

  // Buscar clientes (solo admin)
  async buscarClientes(query: string): Promise<Usuario[]> {
    const response = await api.get('/usuarios/buscar', { params: { q: query } });
    return response.data.usuarios;
  },

  // Obtener un usuario específico (solo admin)
  async getUsuario(id: number): Promise<Usuario> {
    const response = await api.get(`/usuarios/${id}`);
    return response.data.usuario;
  },
};

export const comentarioService = {
  // Crear o actualizar comentario
  async guardarComentario(reservaId: number, textoComentario: string): Promise<{ mensaje: string }> {
    const response = await api.post(`/comentarios/reserva/${reservaId}`, { textoComentario });
    return response.data;
  },

  // Obtener comentarios de una reserva
  async getComentarios(reservaId: number): Promise<{ comentarios: any[] }> {
    const response = await api.get(`/comentarios/reserva/${reservaId}`);
    return response.data;
  },

  // Eliminar comentario
  async eliminarComentario(id: number): Promise<{ mensaje: string }> {
    const response = await api.delete(`/comentarios/${id}`);
    return response.data;
  },
};
