import { Router } from 'express';
import { prisma } from '../index';
import { verificarToken, verificarResponsable, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Obtener parámetros de capacidad (todos los usuarios autenticados)
router.get('/', verificarToken, async (req, res) => {
  try {
    const parametros = await prisma.parametrosCapacidadRestaurante.findFirst();

    if (!parametros) {
      return res.status(404).json({ error: 'Parámetros no configurados.' });
    }

    const capacidadTotal = parametros.capacidadFrente + parametros.capacidadGaleria + parametros.capacidadSalon;

    res.json({
      parametros: {
        ...parametros,
        capacidadTotal,
        diasApertura: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        turnos: ['ALMUERZO', 'CENA']
      }
    });
  } catch (error) {
    console.error('Error al obtener parámetros:', error);
    res.status(500).json({ error: 'Error al obtener parámetros.' });
  }
});

// Actualizar parámetros (solo responsables)
router.put('/', verificarToken, verificarResponsable, async (req: AuthRequest, res) => {
  try {
    const { capacidadFrente, capacidadGaleria, capacidadSalon, anticipacionMaximaDias } = req.body;

    const parametrosExistentes = await prisma.parametrosCapacidadRestaurante.findFirst();

    if (!parametrosExistentes) {
      return res.status(404).json({ error: 'Parámetros no configurados.' });
    }

    const parametrosActualizados = await prisma.parametrosCapacidadRestaurante.update({
      where: { id: parametrosExistentes.id },
      data: {
        ...(capacidadFrente !== undefined && { capacidadFrente }),
        ...(capacidadGaleria !== undefined && { capacidadGaleria }),
        ...(capacidadSalon !== undefined && { capacidadSalon }),
        ...(anticipacionMaximaDias !== undefined && { anticipacionMaximaDias })
      }
    });

    res.json({
      mensaje: 'Parámetros actualizados correctamente.',
      parametros: parametrosActualizados
    });
  } catch (error) {
    console.error('Error al actualizar parámetros:', error);
    res.status(500).json({ error: 'Error al actualizar parámetros.' });
  }
});

export default router;
