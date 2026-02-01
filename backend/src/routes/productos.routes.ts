import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/productos - Listar todos los productos con categorías
router.get('/', async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true
      },
      orderBy: [
        { categoria: { nombre: 'asc' } },
        { nombre: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: productos
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/productos/categorias - Listar categorías
router.get('/categorias', async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoriaProducto.findMany({
      where: { activa: true },
      include: {
        _count: {
          select: { productos: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/productos/categorias - Crear nueva categoría
router.post('/categorias', verificarToken, async (req: Request, res: Response) => {
  try {
    const { nombre } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }

    const nuevaCategoria = await prisma.categoriaProducto.create({
      data: {
        nombre: nombre.trim()
      }
    });

    res.status(201).json({
      success: true,
      data: nuevaCategoria,
      message: 'Categoría creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/productos - Crear nuevo producto
router.post('/', verificarToken, async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, precio, categoriaId, tiempoPreparacion } = req.body;

    // Validaciones
    if (!nombre?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del producto es requerido'
      });
    }

    if (!precio || precio <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    if (!categoriaId) {
      return res.status(400).json({
        success: false,
        message: 'La categoría es requerida'
      });
    }

    // Verificar que existe la categoría
    const categoria = await prisma.categoriaProducto.findUnique({
      where: { id: categoriaId, activa: true }
    });

    if (!categoria) {
      return res.status(400).json({
        success: false,
        message: 'Categoría no válida'
      });
    }

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim(),
        precio: parseFloat(precio),
        categoriaId,
        tiempoPreparacion: tiempoPreparacion ? parseInt(tiempoPreparacion) : null
      },
      include: {
        categoria: true
      }
    });

    res.status(201).json({
      success: true,
      data: nuevoProducto,
      message: 'Producto creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/productos/:id - Actualizar producto
router.put('/:id', verificarToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, categoriaId, disponible, tiempoPreparacion } = req.body;

    const productoActualizado = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: {
        nombre: nombre?.trim(),
        descripcion: descripcion?.trim(),
        precio: precio ? parseFloat(precio) : undefined,
        categoriaId: categoriaId || undefined,
        disponible: disponible !== undefined ? disponible : undefined,
        tiempoPreparacion: tiempoPreparacion ? parseInt(tiempoPreparacion) : null
      },
      include: {
        categoria: true
      }
    });

    res.json({
      success: true,
      data: productoActualizado,
      message: 'Producto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/productos/:id - Eliminar producto (cambiar disponible a false)
router.delete('/:id', verificarToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.producto.update({
      where: { id: parseInt(id) },
      data: { disponible: false }
    });

    res.json({
      success: true,
      message: 'Producto marcado como no disponible'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;