import api from './api';

export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  zona: 'FRENTE' | 'GALERIA' | 'SALON';
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  estado?: 'LIBRE' | 'OCUPADA';
  cuentaActiva?: any;
  cuentas?: any[];
}

export interface OcupacionZona {
  zona: string;
  total: number;
  ocupadas: number;
  libres: number;
  porcentajeOcupacion: number;
}

export interface CreateMesaData {
  numero: number;
  capacidad: number;
  zona: 'FRENTE' | 'GALERIA' | 'SALON';
}

export interface UpdateMesaData extends Partial<CreateMesaData> {
  activa?: boolean;
}

const mesasService = {
  // Obtener todas las mesas
  getMesas: async (): Promise<Mesa[]> => {
    const response = await api.get('/mesas');
    return response.data.data;
  },

  // Obtener ocupación por zona
  getOcupacion: async (): Promise<OcupacionZona[]> => {
    const response = await api.get('/mesas/ocupacion');
    return response.data.data;
  },

  // Crear mesa
  createMesa: async (data: CreateMesaData): Promise<Mesa> => {
    const response = await api.post('/mesas', data);
    return response.data.data;
  },

  // Actualizar mesa
  updateMesa: async (id: number, data: UpdateMesaData): Promise<Mesa> => {
    const response = await api.put(`/mesas/${id}`, data);
    return response.data.data;
  },

  // Desactivar mesa
  deleteMesa: async (id: number): Promise<void> => {
    await api.delete(`/mesas/${id}`);
  },

  // Filtros y utilidades
  getMesasPorZona: (mesas: Mesa[], zona: string): Mesa[] => {
    return mesas.filter(mesa => mesa.zona === zona);
  },

  getMesasLibres: (mesas: Mesa[]): Mesa[] => {
    return mesas.filter(mesa => mesa.estado === 'LIBRE' && mesa.activa);
  },

  getMesasOcupadas: (mesas: Mesa[]): Mesa[] => {
    return mesas.filter(mesa => mesa.estado === 'OCUPADA');
  },

  // Obtener resumen de ocupación
  getResumenOcupacion: (mesas: Mesa[]) => {
    const total = mesas.filter(m => m.activa).length;
    const ocupadas = mesas.filter(m => m.estado === 'OCUPADA').length;
    const libres = total - ocupadas;
    
    return {
      total,
      ocupadas,
      libres,
      porcentajeOcupacion: total > 0 ? Math.round((ocupadas / total) * 100) : 0
    };
  }
};

export default mesasService;