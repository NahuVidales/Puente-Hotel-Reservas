import api from './api';
import { Mesa } from './mesas.service';
import { Mozo } from './mozos.service';
import { Producto } from './productos.service';

export interface ItemPedido {
  id: number;
  cuentaId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  observaciones?: string;
  estado: 'PENDIENTE' | 'EN_COCINA' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
  fechaPedido: string;
  fechaEntrega?: string;
  fechaActualizacion: string;
  producto: Producto;
}

export interface Cuenta {
  id: number;
  mesaId: number;
  mozoId: number;
  reservaId?: number;
  numeroClientes: number;
  fechaApertura: string;
  fechaCierre?: string;
  subtotal: number;
  propina: number;
  total: number;
  estado: 'ABIERTA' | 'CERRADA' | 'CANCELADA';
  observaciones?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  mesa: Mesa;
  mozo: Mozo;
  items: ItemPedido[];
  resumen?: {
    totalItems: number;
    itemsPendientes: number;
    itemsEnCocina: number;
    itemsListos: number;
    itemsEntregados: number;
  };
}

export interface CreateCuentaData {
  mesaId: number;
  mozoId: number;
  numeroClientes: number;
  observaciones?: string;
}

export interface CreateCuentaDesdeReservaData {
  reservaId: number;
  mesaId: number;
  mozoId: number;
}

export interface CreateItemPedidoData {
  productoId: number;
  cantidad: number;
  observaciones?: string;
}

export interface CuentaFilters {
  estado?: 'ABIERTA' | 'CERRADA' | 'CANCELADA' | 'TODAS';
  fecha?: string;
  mesaId?: number;
  mozoId?: number;
}

const cuentasService = {
  // Obtener cuentas con filtros
  getCuentas: async (filters?: CuentaFilters): Promise<Cuenta[]> => {
    let url = '/cuentas';
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.fecha) params.append('fecha', filters.fecha);
      if (filters.mesaId) params.append('mesaId', filters.mesaId.toString());
      if (filters.mozoId) params.append('mozoId', filters.mozoId.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const response = await api.get(url);
    return response.data.data;
  },

  // Obtener cuenta específica
  getCuenta: async (id: number): Promise<Cuenta> => {
    const response = await api.get(`/cuentas/${id}`);
    return response.data.data;
  },

  // Crear nueva cuenta
  createCuenta: async (data: CreateCuentaData): Promise<Cuenta> => {
    const response = await api.post('/cuentas', data);
    return response.data.data;
  },

  // Crear cuenta desde una reserva (asignar mesa y mozo)
  createCuentaDesdeReserva: async (data: CreateCuentaDesdeReservaData): Promise<Cuenta> => {
    const response = await api.post('/cuentas/desde-reserva', data);
    return response.data.data;
  },

  // Agregar item a la cuenta
  addItem: async (cuentaId: number, data: CreateItemPedidoData): Promise<ItemPedido> => {
    const response = await api.post(`/cuentas/${cuentaId}/items`, data);
    return response.data.data;
  },

  // Actualizar estado de item
  updateItemEstado: async (
    cuentaId: number, 
    itemId: number, 
    estado: ItemPedido['estado']
  ): Promise<ItemPedido> => {
    const response = await api.put(`/cuentas/${cuentaId}/items/${itemId}`, { estado });
    return response.data.data;
  },

  // Cerrar cuenta
  cerrarCuenta: async (id: number, propina?: number): Promise<Cuenta> => {
    const response = await api.put(`/cuentas/${id}/cerrar`, { propina: propina || 0 });
    return response.data.data;
  },

  // Utilidades
  getCuentasAbiertas: (cuentas: Cuenta[]): Cuenta[] => {
    return cuentas.filter(cuenta => cuenta.estado === 'ABIERTA');
  },

  getCuentasCerradas: (cuentas: Cuenta[]): Cuenta[] => {
    return cuentas.filter(cuenta => cuenta.estado === 'CERRADA');
  },

  getCuentasPorMozo: (cuentas: Cuenta[], mozoId: number): Cuenta[] => {
    return cuentas.filter(cuenta => cuenta.mozoId === mozoId);
  },

  getCuentasPorMesa: (cuentas: Cuenta[], mesaId: number): Cuenta[] => {
    return cuentas.filter(cuenta => cuenta.mesaId === mesaId);
  },

  // Calcular tiempo promedio de atención
  getTiempoAtencion: (cuenta: Cuenta): number | null => {
    if (!cuenta.fechaCierre) return null;
    
    const apertura = new Date(cuenta.fechaApertura);
    const cierre = new Date(cuenta.fechaCierre);
    
    return Math.round((cierre.getTime() - apertura.getTime()) / (1000 * 60)); // minutos
  },

  // Obtener estadísticas de items
  getEstadisticasItems: (items: ItemPedido[]) => {
    return {
      total: items.length,
      pendientes: items.filter(i => i.estado === 'PENDIENTE').length,
      enCocina: items.filter(i => i.estado === 'EN_COCINA').length,
      listos: items.filter(i => i.estado === 'LISTO').length,
      entregados: items.filter(i => i.estado === 'ENTREGADO').length,
      cancelados: items.filter(i => i.estado === 'CANCELADO').length
    };
  },

  // Calcular total de cuenta
  calcularTotales: (items: ItemPedido[], propina: number = 0) => {
    const subtotal = items.reduce((sum, item) => {
      return item.estado !== 'CANCELADO' ? sum + item.precioTotal : sum;
    }, 0);
    
    return {
      subtotal,
      propina,
      total: subtotal + propina
    };
  },

  // Validar si se puede cerrar cuenta
  puedeSerCerrada: (cuenta: Cuenta): { puede: boolean; razon?: string } => {
    if (cuenta.estado !== 'ABIERTA') {
      return { puede: false, razon: 'La cuenta no está abierta' };
    }

    const itemsPendientes = cuenta.items.filter(item => 
      item.estado !== 'ENTREGADO' && item.estado !== 'CANCELADO'
    );

    if (itemsPendientes.length > 0) {
      return { 
        puede: false, 
        razon: `Hay ${itemsPendientes.length} items pendientes de entrega` 
      };
    }

    return { puede: true };
  }
};

export default cuentasService;