import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/mozos - Listar todos los mozos
router.get('/', async (req: Request, res: Response) => {
  try {
    const mozos = await prisma.mozo.findMany({
      where: { activo: true },
      include: {
        cuentas: {
          where: { estado: 'ABIERTA' },
          include: {
            mesa: true,
            _count: {
              select: { items: true }
            }
          }
        },
        _count: {
          select: {
            cuentas: {
              where: {
                fechaCierre: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)) // Hoy
                }
              }
            }
          }
        }
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    });

    // Agregar estadísticas del día
    const mozosConEstadisticas = mozos.map(mozo => ({
      ...mozo,
      mesasActivas: mozo.cuentas.length,
      ventasHoy: mozo._count.cuentas,
      estado: mozo.cuentas.length > 0 ? 'TRABAJANDO' : 'DISPONIBLE'
    }));

    res.json({
      success: true,
      data: mozosConEstadisticas
    });
  } catch (error) {
    console.error('Error al obtener mozos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/mozos/:id/estadisticas - Estadísticas detalladas de un mozo
router.get('/:id/estadisticas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.query;

    const fechaDesde = desde ? new Date(desde as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const fechaHasta = hasta ? new Date(hasta as string) : new Date();

    const estadisticas = await prisma.cuenta.groupBy({
      by: ['mozoId'],
      where: {
        mozoId: parseInt(id),
        fechaCierre: {
          gte: fechaDesde,
          lte: fechaHasta
        }
      },
      _sum: {
        total: true,
        propina: true
      },
      _count: {
        id: true
      },
      _avg: {
        total: true,
        propina: true
      }
    });

    const mozo = await prisma.mozo.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        apellido: true
      }
    });

    res.json({
      success: true,
      data: {
        mozo,
        periodo: { desde: fechaDesde, hasta: fechaHasta },
        estadisticas: estadisticas[0] || {
          _sum: { total: 0, propina: 0 },
          _count: { id: 0 },
          _avg: { total: 0, propina: 0 }
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/mozos - Crear nuevo mozo
router.post('/', verificarToken, async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, telefono, dni } = req.body;

    // Validaciones
    if (!nombre?.trim() || !apellido?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y apellido son requeridos'
      });
    }

    if (!dni?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'DNI es requerido'
      });
    }

    if (!telefono?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono es requerido'
      });
    }

    // Verificar DNI único
    const dniExistente = await prisma.mozo.findUnique({
      where: { dni: dni.trim() }
    });

    if (dniExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un mozo con ese DNI'
      });
    }

    const nuevoMozo = await prisma.mozo.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        dni: dni.trim()
      }
    });

    res.status(201).json({
      success: true,
      data: nuevoMozo,
      message: 'Mozo registrado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear mozo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/mozos/:id - Actualizar mozo
router.put('/:id', verificarToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, dni, activo } = req.body;

    const mozoActualizado = await prisma.mozo.update({
      where: { id: parseInt(id) },
      data: {
        nombre: nombre?.trim(),
        apellido: apellido?.trim(),
        telefono: telefono?.trim(),
        dni: dni?.trim(),
        activo: activo !== undefined ? activo : undefined
      }
    });

    res.json({
      success: true,
      data: mozoActualizado,
      message: 'Mozo actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar mozo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/mozos/:id - Desactivar mozo
router.delete('/:id', verificarToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que no tenga mesas asignadas
    const mesasActivas = await prisma.cuenta.count({
      where: {
        mozoId: parseInt(id),
        estado: 'ABIERTA'
      }
    });

    if (mesasActivas > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede desactivar un mozo con mesas asignadas'
      });
    }

    await prisma.mozo.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Mozo desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar mozo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;