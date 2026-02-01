import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/mesas - Listar todas las mesas
router.get('/', async (req: Request, res: Response) => {
  try {
    const mesas = await prisma.mesa.findMany({
      where: { activa: true },
      include: {
        cuentas: {
          where: { estado: 'ABIERTA' },
          include: {
            mozo: {
              select: {
                id: true,
                nombre: true,
                apellido: true
              }
            },
            items: {
              include: {
                producto: true
              }
            }
          }
        }
      },
      orderBy: { numero: 'asc' }
    });

    // Agregar estado actual de cada mesa
    const mesasConEstado = mesas.map(mesa => ({
      ...mesa,
      estado: mesa.cuentas.length > 0 ? 'OCUPADA' : 'LIBRE',
      cuentaActiva: mesa.cuentas[0] || null
    }));

    res.json({
      success: true,
      data: mesasConEstado
    });
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/mesas/ocupacion - Estado de ocupación del restaurante
router.get('/ocupacion', async (req: Request, res: Response) => {
  try {
    const mesasPorZona = await prisma.mesa.groupBy({
      by: ['zona'],
      where: { activa: true },
      _count: {
        id: true
      }
    });

    const mesasOcupadasPorZona = await prisma.mesa.groupBy({
      by: ['zona'],
      where: {
        activa: true,
        cuentas: {
          some: {
            estado: 'ABIERTA'
          }
        }
      },
      _count: {
        id: true
      }
    });

    const ocupacion = mesasPorZona.map(zona => {
      const ocupadas = mesasOcupadasPorZona.find(o => o.zona === zona.zona)?._count.id || 0;
      return {
        zona: zona.zona,
        total: zona._count.id,
        ocupadas,
        libres: zona._count.id - ocupadas,
        porcentajeOcupacion: Math.round((ocupadas / zona._count.id) * 100)
      };
    });

    res.json({
      success: true,
      data: ocupacion
    });
  } catch (error) {
    console.error('Error al obtener ocupación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/mesas - Crear nueva mesa
router.post('/', verificarToken, async (req: Request, res: Response) => {
  try {
    const { numero, capacidad, zona } = req.body;

    // Validaciones
    if (!numero || numero <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El número de mesa es requerido y debe ser mayor a 0'
      });
    }

    if (!capacidad || capacidad <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La capacidad debe ser mayor a 0'
      });
    }

    const zonasValidas = ['FRENTE', 'GALERIA', 'SALON'];
    if (!zona || !zonasValidas.includes(zona)) {
      return res.status(400).json({
        success: false,
        message: 'La zona debe ser FRENTE, GALERIA o SALON'
      });
    }

    // Verificar que no existe otra mesa con el mismo número
    const mesaExistente = await prisma.mesa.findUnique({
      where: { numero }
    });

    if (mesaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una mesa con ese número'
      });
    }

    const nuevaMesa = await prisma.mesa.create({
      data: {
        numero,
        capacidad,
        zona
      }
    });

    res.status(201).json({
      success: true,
      data: nuevaMesa,
      message: 'Mesa creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/mesas/:id - Actualizar mesa
router.put('/:id', verificarToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { numero, capacidad, zona, activa } = req.body;

    const mesaActualizada = await prisma.mesa.update({
      where: { id: parseInt(id) },
      data: {
        numero: numero || undefined,
        capacidad: capacidad || undefined,
        zona: zona || undefined,
        activa: activa !== undefined ? activa : undefined
      }
    });

    res.json({
      success: true,
      data: mesaActualizada,
      message: 'Mesa actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/mesas/:id - Desactivar mesa
router.delete('/:id', verificarToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que la mesa no tenga cuentas abiertas
    const cuentasAbiertas = await prisma.cuenta.count({
      where: {
        mesaId: parseInt(id),
        estado: 'ABIERTA'
      }
    });

    if (cuentasAbiertas > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede desactivar una mesa con cuentas abiertas'
      });
    }

    await prisma.mesa.update({
      where: { id: parseInt(id) },
      data: { activa: false }
    });

    res.json({
      success: true,
      message: 'Mesa desactivada exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;