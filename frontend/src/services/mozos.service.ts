import api from './api';

export interface Mozo {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string;
  activo: boolean;
  fechaIngreso: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  mesasActivas?: number;
  ventasHoy?: number;
  estado?: 'DISPONIBLE' | 'TRABAJANDO';
  cuentas?: any[];
  _count?: { cuentas: number };
}

export interface CreateMozoData {
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string;
}

export interface UpdateMozoData extends Partial<CreateMozoData> {
  activo?: boolean;
}

export interface EstadisticasMozo {
  mozo: {
    id: number;
    nombre: string;
    apellido: string;
  };
  periodo: {
    desde: string;
    hasta: string;
  };
  estadisticas: {
    _sum: {
      total: number;
      propina: number;
    };
    _count: {
      id: number;
    };
    _avg: {
      total: number;
      propina: number;
    };
  };
}

const mozosService = {
  // Obtener todos los mozos
  getMozos: async (): Promise<Mozo[]> => {
    const response = await api.get('/mozos');
    return response.data.data;
  },

  // Obtener estadísticas de un mozo
  getEstadisticasMozo: async (
    id: number, 
    desde?: string, 
    hasta?: string
  ): Promise<EstadisticasMozo> => {
    let url = `/mozos/${id}/estadisticas`;
    const params = new URLSearchParams();
    
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await api.get(url);
    return response.data.data;
  },

  // Crear mozo
  createMozo: async (data: CreateMozoData): Promise<Mozo> => {
    const response = await api.post('/mozos', data);
    return response.data.data;
  },

  // Actualizar mozo
  updateMozo: async (id: number, data: UpdateMozoData): Promise<Mozo> => {
    const response = await api.put(`/mozos/${id}`, data);
    return response.data.data;
  },

  // Desactivar mozo
  deleteMozo: async (id: number): Promise<void> => {
    await api.delete(`/mozos/${id}`);
  },

  // Utilidades
  getMozosActivos: (mozos: Mozo[]): Mozo[] => {
    return mozos.filter(mozo => mozo.activo);
  },

  getMozosDisponibles: (mozos: Mozo[]): Mozo[] => {
    return mozos.filter(mozo => mozo.activo && (mozo.mesasActivas || 0) === 0);
  },

  getMozosTrabajando: (mozos: Mozo[]): Mozo[] => {
    return mozos.filter(mozo => (mozo.mesasActivas || 0) > 0);
  },

  // Formatear nombre completo
  getNombreCompleto: (mozo: Mozo): string => {
    return `${mozo.nombre} ${mozo.apellido}`;
  },

  // Calcular rendimiento promedio
  getRendimientoPromedio: (estadisticas: EstadisticasMozo['estadisticas']) => {
    const { _sum, _count, _avg } = estadisticas;
    
    return {
      ventaTotal: _sum.total || 0,
      propinaTotal: _sum.propina || 0,
      cuentasAtendidas: _count.id || 0,
      ventaPromedioPorCuenta: _avg.total || 0,
      propinaPromedioPorCuenta: _avg.propina || 0
    };
  }
};

export default mozosService;