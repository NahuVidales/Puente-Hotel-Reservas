import api from './api';

export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
  fechaCreacion: string;
}

export interface CrearClienteForm {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
}

export const clienteService = {
  // Obtener todos los clientes (todos los usuarios del sistema)
  async getClientes(): Promise<Cliente[]> {
    const response = await api.get('/empleados');
    return response.data.empleados;
  },

  // Obtener un cliente específico
  async getCliente(id: number): Promise<Cliente> {
    const response = await api.get(`/empleados/${id}`);
    return response.data.empleado;
  },

  // Crear nuevo cliente (empleado desde admin)
  async crearCliente(datos: CrearClienteForm): Promise<{ mensaje: string; cliente: Cliente }> {
    const response = await api.post('/empleados', datos);
    return {
      mensaje: response.data.mensaje,
      cliente: response.data.empleado
    };
  },

  // Actualizar cliente
  async actualizarCliente(
    id: number,
    datos: Partial<Omit<CrearClienteForm, 'password'>>
  ): Promise<{ mensaje: string; cliente: Cliente }> {
    const response = await api.put(`/empleados/${id}`, datos);
    return {
      mensaje: response.data.mensaje,
      cliente: response.data.empleado
    };
  },

  // Eliminar cliente
  async eliminarCliente(id: number): Promise<{ mensaje: string }> {
    const response = await api.delete(`/empleados/${id}`);
    return {
      mensaje: response.data.mensaje
    };
  }
};
