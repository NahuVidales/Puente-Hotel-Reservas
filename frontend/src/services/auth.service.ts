import api from './api';
import { Usuario, LoginForm, RegistroForm, AuthResponse } from '../types';

export const authService = {
  // Registro de nuevo usuario
  async registro(datos: RegistroForm): Promise<AuthResponse> {
    const response = await api.post('/auth/registro', {
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono,
      email: datos.email,
      password: datos.password,
    });
    
    // Guardar token y usuario en localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    }
    
    return response.data;
  },

  // Inicio de sesión
  async login(datos: LoginForm): Promise<AuthResponse> {
    const response = await api.post('/auth/login', datos);
    
    // Guardar token y usuario en localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    }
    
    return response.data;
  },

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  },

  // Obtener usuario actual
  async getUsuarioActual(): Promise<Usuario | null> {
    try {
      const response = await api.get('/auth/me');
      return response.data.usuario;
    } catch {
      return null;
    }
  },

  // Actualizar perfil
  async actualizarPerfil(datos: Partial<Usuario>): Promise<Usuario> {
    const response = await api.put('/auth/perfil', datos);
    
    // Actualizar usuario en localStorage
    if (response.data.usuario) {
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    }
    
    return response.data.usuario;
  },

  // Cambiar contraseña
  async cambiarContrasena(passwordActual: string, passwordNueva: string): Promise<void> {
    await api.put('/auth/perfil/password', {
      passwordActual,
      passwordNueva
    });
  },

  // Verificar si hay sesión activa
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  // Obtener usuario guardado
  getUsuarioGuardado(): Usuario | null {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  // Verificar si es responsable
  isResponsable(): boolean {
    const usuario = this.getUsuarioGuardado();
    return usuario?.rol === 'RESPONSABLE';
  },
};
