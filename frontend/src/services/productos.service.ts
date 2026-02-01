import api from './api';

export interface CategoriaProducto {
  id: number;
  nombre: string;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  _count?: { productos: number };
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: number;
  categoria: CategoriaProducto;
  disponible: boolean;
  tiempoPreparacion?: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreateProductoData {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: number;
  tiempoPreparacion?: number;
}

export interface UpdateProductoData extends Partial<CreateProductoData> {
  disponible?: boolean;
}

const productosService = {
  // Obtener todos los productos
  getProductos: async (): Promise<Producto[]> => {
    const response = await api.get('/productos');
    return response.data.data;
  },

  // Obtener categorías
  getCategorias: async (): Promise<CategoriaProducto[]> => {
    const response = await api.get('/productos/categorias');
    return response.data.data;
  },

  // Crear nueva categoría
  createCategoria: async (nombre: string): Promise<CategoriaProducto> => {
    const response = await api.post('/productos/categorias', { nombre });
    return response.data.data;
  },

  // Crear producto
  createProducto: async (data: CreateProductoData): Promise<Producto> => {
    const response = await api.post('/productos', data);
    return response.data.data;
  },

  // Actualizar producto
  updateProducto: async (id: number, data: UpdateProductoData): Promise<Producto> => {
    const response = await api.put(`/productos/${id}`, data);
    return response.data.data;
  },

  // Eliminar producto (marcar como no disponible)
  deleteProducto: async (id: number): Promise<void> => {
    await api.delete(`/productos/${id}`);
  },

  // Buscar productos por categoría
  getProductosByCategoria: (productos: Producto[], categoriaId: number): Producto[] => {
    return productos.filter(producto => producto.categoriaId === categoriaId);
  },

  // Buscar productos disponibles
  getProductosDisponibles: (productos: Producto[]): Producto[] => {
    return productos.filter(producto => producto.disponible);
  }
};

export default productosService;