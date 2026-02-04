import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/cuentas - Listar cuentas con filtros
router.get('/', async (req: Request, res: Response) => {
  try {
    const { estado = 'ABIERTA', fecha, mesaId, mozoId } = req.query;

    const filtros: any = {};
    
    if (estado !== 'TODAS') {
      filtros.estado = estado;
    }

    if (fecha) {
      const fechaFiltro = new Date(fecha as string);
      const fechaInicio = new Date(fechaFiltro.setHours(0, 0, 0, 0));
      const fechaFin = new Date(fechaFiltro.setHours(23, 59, 59, 999));
      
      filtros.fechaApertura = {
        gte: fechaInicio,
        lte: fechaFin
      };
    }

    if (mesaId) {
      filtros.mesaId = parseInt(mesaId as string);
    }

    if (mozoId) {
      filtros.mozoId = parseInt(mozoId as string);
    }

    const cuentas = await prisma.cuenta.findMany({
      where: filtros,
      include: {
        mesa: true,
        mozo: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        items: {
          include: {
            producto: {
              include: {
                categoria: true
              }
            }
          },
          orderBy: { fechaPedido: 'desc' }
        }
      },
      orderBy: { fechaApertura: 'desc' }
    });

    // Calcular totales y estadísticas
    const cuentasConResumen = cuentas.map(cuenta => ({
      ...cuenta,
      resumen: {
        totalItems: cuenta.items.length,
        itemsPendientes: cuenta.items.filter(item => item.estado === 'PENDIENTE').length,
        itemsEnCocina: cuenta.items.filter(item => item.estado === 'EN_COCINA').length,
        itemsListos: cuenta.items.filter(item => item.estado === 'LISTO').length,
        itemsEntregados: cuenta.items.filter(item => item.estado === 'ENTREGADO').length
      }
    }));

    res.json({
      success: true,
      data: cuentasConResumen
    });
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/cuentas/:id - Obtener cuenta específica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cuenta = await prisma.cuenta.findUnique({
      where: { id: parseInt(id) },
      include: {
        mesa: true,
        mozo: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        items: {
          include: {
            producto: {
              include: {
                categoria: true
              }
            }
          },
          orderBy: { fechaPedido: 'asc' }
        }
      }
    });

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    res.json({
      success: true,
      data: cuenta
    });
  } catch (error) {
    console.error('Error al obtener cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/cuentas - Crear nueva cuenta
router.post('/', verificarToken, async (req: Request, res: Response) => {
  try {
    const { mesaId, mozoId, numeroClientes, observaciones } = req.body;

    // Validaciones
    if (!mesaId || !mozoId) {
      return res.status(400).json({
        success: false,
        message: 'Mesa y mozo son requeridos'
      });
    }

    if (!numeroClientes || numeroClientes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El número de clientes debe ser mayor a 0'
      });
    }

    // Verificar que la mesa esté libre
    const cuentaActiva = await prisma.cuenta.findFirst({
      where: {
        mesaId,
        estado: 'ABIERTA'
      }
    });

    if (cuentaActiva) {
      return res.status(400).json({
        success: false,
        message: 'La mesa ya tiene una cuenta abierta'
      });
    }

    // Verificar que existan mesa y mozo
    const [mesa, mozo] = await Promise.all([
      prisma.mesa.findUnique({ where: { id: mesaId, activa: true } }),
      prisma.mozo.findUnique({ where: { id: mozoId, activo: true } })
    ]);

    if (!mesa || !mozo) {
      return res.status(400).json({
        success: false,
        message: 'Mesa o mozo no válidos'
      });
    }

    const nuevaCuenta = await prisma.cuenta.create({
      data: {
        mesaId,
        mozoId,
        numeroClientes,
        observaciones: observaciones?.trim()
      },
      include: {
        mesa: true,
        mozo: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    // Registrar en historial de mesas
    await prisma.historialMesa.create({
      data: {
        mesaId,
        mozoId
      }
    });

    res.status(201).json({
      success: true,
      data: nuevaCuenta,
      message: 'Cuenta creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/cuentas/:id/items - Agregar item a la cuenta
router.post('/:id/items', verificarToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productoId, cantidad, observaciones } = req.body;

    // Validaciones
    if (!productoId || !cantidad || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Producto y cantidad son requeridos'
      });
    }

    // Verificar que la cuenta esté abierta
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: parseInt(id), estado: 'ABIERTA' }
    });

    if (!cuenta) {
      return res.status(400).json({
        success: false,
        message: 'Cuenta no encontrada o ya cerrada'
      });
    }

    // Obtener producto
    const producto = await prisma.producto.findUnique({
      where: { id: productoId, disponible: true }
    });

    if (!producto) {
      return res.status(400).json({
        success: false,
        message: 'Producto no disponible'
      });
    }

    const precioTotal = producto.precio * cantidad;

    const nuevoItem = await prisma.itemPedido.create({
      data: {
        cuentaId: parseInt(id),
        productoId,
        cantidad,
        precioUnitario: producto.precio,
        precioTotal,
        observaciones: observaciones?.trim()
      },
      include: {
        producto: {
          include: {
            categoria: true
          }
        }
      }
    });

    // Actualizar total de la cuenta
    const nuevosItems = await prisma.itemPedido.findMany({
      where: { cuentaId: parseInt(id) }
    });

    const nuevoSubtotal = nuevosItems.reduce((total, item) => total + item.precioTotal, 0);

    await prisma.cuenta.update({
      where: { id: parseInt(id) },
      data: {
        subtotal: nuevoSubtotal,
        total: nuevoSubtotal + cuenta.propina
      }
    });

    res.status(201).json({
      success: true,
      data: nuevoItem,
      message: 'Item agregado exitosamente'
    });
  } catch (error) {
    console.error('Error al agregar item:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/cuentas/:id/items/:itemId - Actualizar estado de item
router.put('/:id/items/:itemId', verificarToken, async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['PENDIENTE', 'EN_COCINA', 'LISTO', 'ENTREGADO', 'CANCELADO'];
    
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const itemActualizado = await prisma.itemPedido.update({
      where: { id: parseInt(itemId) },
      data: {
        estado,
        fechaEntrega: estado === 'ENTREGADO' ? new Date() : undefined
      },
      include: {
        producto: true
      }
    });

    res.json({
      success: true,
      data: itemActualizado,
      message: 'Estado del item actualizado'
    });
  } catch (error) {
    console.error('Error al actualizar item:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/cuentas/:id/cerrar - Cerrar cuenta
router.put('/:id/cerrar', verificarToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { propina = 0 } = req.body;

    const cuenta = await prisma.cuenta.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    });

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    if (cuenta.estado !== 'ABIERTA') {
      return res.status(400).json({
        success: false,
        message: 'La cuenta ya está cerrada'
      });
    }

    const propinaNum = parseFloat(propina.toString()) || 0;
    const totalFinal = cuenta.subtotal + propinaNum;

    const cuentaCerrada = await prisma.cuenta.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'CERRADA',
        propina: propinaNum,
        total: totalFinal,
        fechaCierre: new Date()
      },
      include: {
        mesa: true,
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
    });

    // Actualizar historial de mesa
    await prisma.historialMesa.updateMany({
      where: {
        mesaId: cuenta.mesaId,
        fechaLiberacion: null
      },
      data: {
        fechaLiberacion: new Date()
      }
    });

    res.json({
      success: true,
      data: cuentaCerrada,
      message: 'Cuenta cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error al cerrar cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/cuentas/desde-reserva - Crear cuenta desde una reserva (asignar mesa y mozo)
router.post('/desde-reserva', verificarToken, async (req: Request, res: Response) => {
  try {
    const { reservaId, mesaId, mozoId } = req.body;

    // Validaciones
    if (!reservaId || !mesaId || !mozoId) {
      return res.status(400).json({
        success: false,
        message: 'Reserva, mesa y mozo son requeridos'
      });
    }

    // Verificar que la reserva existe y está en estado RESERVADA
    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { cliente: true, cuenta: true }
    });

    if (!reserva) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    if (reserva.estado !== 'RESERVADA') {
      return res.status(400).json({
        success: false,
        message: 'La reserva no está activa'
      });
    }

    if (reserva.cuenta) {
      return res.status(400).json({
        success: false,
        message: 'La reserva ya tiene una cuenta asignada'
      });
    }

    // Verificar que la mesa esté libre
    const cuentaActiva = await prisma.cuenta.findFirst({
      where: {
        mesaId,
        estado: 'ABIERTA'
      }
    });

    if (cuentaActiva) {
      return res.status(400).json({
        success: false,
        message: 'La mesa ya tiene una cuenta abierta'
      });
    }

    // Verificar que existan mesa y mozo
    const [mesa, mozo] = await Promise.all([
      prisma.mesa.findUnique({ where: { id: mesaId, activa: true } }),
      prisma.mozo.findUnique({ where: { id: mozoId, activo: true } })
    ]);

    if (!mesa) {
      return res.status(400).json({
        success: false,
        message: 'Mesa no válida o no activa'
      });
    }

    if (!mozo) {
      return res.status(400).json({
        success: false,
        message: 'Mozo no válido o no activo'
      });
    }

    // Verificar que la mesa tiene capacidad suficiente
    if (mesa.capacidad < reserva.cantidadPersonas) {
      return res.status(400).json({
        success: false,
        message: `La mesa tiene capacidad para ${mesa.capacidad} personas, pero la reserva es para ${reserva.cantidadPersonas}`
      });
    }

    // Crear la cuenta vinculada a la reserva
    const nuevaCuenta = await prisma.cuenta.create({
      data: {
        mesaId,
        mozoId,
        reservaId,
        numeroClientes: reserva.cantidadPersonas,
        observaciones: reserva.observaciones || `Reserva de ${reserva.cliente.nombre} ${reserva.cliente.apellido}`
      },
      include: {
        mesa: true,
        mozo: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        reserva: {
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                telefono: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Actualizar estado de la reserva a ASIGNADA (opcional, podemos mantener RESERVADA)
    // Por ahora lo dejamos en RESERVADA para no romper el flujo existente

    // Registrar en historial de mesas
    await prisma.historialMesa.create({
      data: {
        mesaId,
        mozoId,
        observaciones: `Reserva #${reservaId} - ${reserva.cliente.nombre} ${reserva.cliente.apellido}`
      }
    });

    res.status(201).json({
      success: true,
      data: nuevaCuenta,
      message: 'Cuenta creada exitosamente desde la reserva'
    });
  } catch (error) {
    console.error('Error al crear cuenta desde reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;