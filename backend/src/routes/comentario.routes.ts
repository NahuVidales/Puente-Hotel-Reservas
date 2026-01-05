import { Router } from 'express';
import { prisma } from '../index';
import { verificarToken, AuthRequest } from '../middleware/auth.middleware';
import { esReservaPasada } from '../utils/validaciones';

const router = Router();

// Crear o actualizar comentario de una reserva
router.post('/reserva/:reservaId', verificarToken, async (req: AuthRequest, res) => {
  try {
    const { reservaId } = req.params;
    const { textoComentario } = req.body;
    const usuario = req.usuario!;

    if (!textoComentario || textoComentario.trim() === '') {
      return res.status(400).json({ error: 'El comentario no puede estar vacío.' });
    }

    // Verificar que la reserva existe y pertenece al usuario
    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(reservaId) }
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    // Solo el cliente dueño puede comentar (o responsable ver)
    if (usuario.rol !== 'RESPONSABLE' && reserva.clienteId !== usuario.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva.' });
    }

    // Solo se pueden comentar reservas pasadas
    if (!esReservaPasada(reserva.fecha)) {
      return res.status(400).json({ 
        error: 'Solo se pueden agregar comentarios a reservas pasadas.' 
      });
    }

    // Verificar si ya existe un comentario para esta reserva
    const comentarioExistente = await prisma.comentarioReserva.findFirst({
      where: { reservaId: parseInt(reservaId) }
    });

    let comentario;

    if (comentarioExistente) {
      // Actualizar comentario existente
      comentario = await prisma.comentarioReserva.update({
        where: { id: comentarioExistente.id },
        data: {
          textoComentario: textoComentario.trim(),
          fechaComentario: new Date()
        }
      });
    } else {
      // Crear nuevo comentario
      comentario = await prisma.comentarioReserva.create({
        data: {
          reservaId: parseInt(reservaId),
          textoComentario: textoComentario.trim()
        }
      });
    }

    res.json({
      mensaje: comentarioExistente ? 'Comentario actualizado.' : 'Comentario agregado.',
      comentario
    });
  } catch (error) {
    console.error('Error al guardar comentario:', error);
    res.status(500).json({ error: 'Error al guardar el comentario.' });
  }
});

// Obtener comentarios de una reserva
router.get('/reserva/:reservaId', verificarToken, async (req: AuthRequest, res) => {
  try {
    const { reservaId } = req.params;
    const usuario = req.usuario!;

    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(reservaId) },
      include: { comentarios: true }
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    // Verificar acceso
    if (usuario.rol !== 'RESPONSABLE' && reserva.clienteId !== usuario.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva.' });
    }

    res.json({ comentarios: reserva.comentarios });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios.' });
  }
});

// Eliminar comentario
router.delete('/:id', verificarToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario!;

    const comentario = await prisma.comentarioReserva.findUnique({
      where: { id: parseInt(id) },
      include: { reserva: true }
    });

    if (!comentario) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }

    // Verificar acceso
    if (usuario.rol !== 'RESPONSABLE' && comentario.reserva.clienteId !== usuario.id) {
      return res.status(403).json({ error: 'No tienes acceso a este comentario.' });
    }

    await prisma.comentarioReserva.delete({
      where: { id: parseInt(id) }
    });

    res.json({ mensaje: 'Comentario eliminado.' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: 'Error al eliminar el comentario.' });
  }
});

export default router;
