import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registro: (datos: {
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isResponsable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión activa al cargar
    const verificarSesion = async () => {
      try {
        const usuarioGuardado = authService.getUsuarioGuardado();
        if (usuarioGuardado && authService.isAuthenticated()) {
          // Verificar que el token sigue siendo válido
          const usuarioActual = await authService.getUsuarioActual();
          if (usuarioActual) {
            setUsuario(usuarioActual);
          } else {
            // Token inválido, limpiar
            await authService.logout();
          }
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    verificarSesion();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUsuario(response.usuario);
  };

  const registro = async (datos: {
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    password: string;
  }) => {
    const response = await authService.registro({
      ...datos,
      confirmarPassword: datos.password
    });
    setUsuario(response.usuario);
  };

  const logout = async () => {
    await authService.logout();
    setUsuario(null);
  };

  const value: AuthContextType = {
    usuario,
    loading,
    login,
    registro,
    logout,
    isAuthenticated: !!usuario,
    isResponsable: usuario?.rol === 'RESPONSABLE'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
