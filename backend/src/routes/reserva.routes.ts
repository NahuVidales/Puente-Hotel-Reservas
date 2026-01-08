import { Router } from 'express';
import { prisma } from '../index';
import { verificarToken, verificarResponsable, AuthRequest } from '../middleware/auth.middleware';
import {
  esDiaApertura,
  estaEnRangoAnticipacion,
  faltanMasDe24Horas,
  esReservaFutura,
  validarCantidadPersonas,
  NOMBRES_DIAS,
  DIAS_APERTURA,
  getRangoTamanoGrupo,
  parsearFechaISO,
  serializarFechaISO,
  validarCapacidadZona
} from '../utils/validaciones';

const router = Router();

// Obtener disponibilidad para una fecha y turno
router.get('/disponibilidad', verificarToken, async (req: AuthRequest, res) => {
  try {
    let { fecha, turno } = req.query;

    console.log('[GET /reservas/disponibilidad] Parámetros query recibidos:', { fecha, turno, tipoFecha: typeof fecha, tipoTurno: typeof turno });

    // Normalizar turno si viene como array
    if (Array.isArray(turno)) {
      turno = turno[0];
    }
    if (Array.isArray(fecha)) {
      fecha = fecha[0];
    }

    if (!fecha || !turno) {
      console.log('[GET /reservas/disponibilidad] Parámetros inválidos:', { fecha, turno });
      return res.status(400).json({ 
        error: 'Se requiere fecha y turno.' 
      });
    }

    // Validar formato de fecha
    if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      console.log('[GET /reservas/disponibilidad] Formato de fecha inválido:', fecha);
      return res.status(400).json({
        error: 'Formato de fecha inválido. Use YYYY-MM-DD.'
      });
    }

    // Validar turno
    const turnoStr = String(turno).toUpperCase();
    if (!['ALMUERZO', 'CENA'].includes(turnoStr)) {
      console.log('[GET /reservas/disponibilidad] Turno inválido:', turno);
      return res.status(400).json({
        error: 'Turno inválido. Use ALMUERZO o CENA.'
      });
    }

    const fechaReserva = parsearFechaISO(fecha as string);

    console.log('[GET /reservas/disponibilidad] Fecha string recibida:', fecha);
    console.log('[GET /reservas/disponibilidad] Fecha parseada:', fechaReserva.toISOString());
    console.log('[GET /reservas/disponibilidad] getDay():', fechaReserva.getDay());
    console.log('[GET /reservas/disponibilidad] DIAS_APERTURA:', DIAS_APERTURA);
    console.log('[GET /reservas/disponibilidad] Turno normalizado:', turnoStr);

    // Validar día de apertura
    if (!esDiaApertura(fechaReserva)) {
      const diaSemana = fechaReserva.getDay();
      console.log('[GET /reservas/disponibilidad] Día de semana rechazado:', diaSemana, NOMBRES_DIAS[diaSemana]);
      return res.status(400).json({
        error: `El restaurante no abre los ${NOMBRES_DIAS[diaSemana]}. Abrimos de martes a sábado.`
      });
    }

    // Obtener parámetros de capacidad
    const parametros = await prisma.parametrosCapacidadRestaurante.findFirst();
    
    if (!parametros) {
      console.log('[GET /reservas/disponibilidad] Parámetros de capacidad no encontrados');
      return res.status(500).json({ error: 'Error de configuración del restaurante.' });
    }

    // Validar rango de anticipación
    if (!estaEnRangoAnticipacion(fechaReserva, parametros.anticipacionMaximaDias)) {
      console.log('[GET /reservas/disponibilidad] Fuera de rango de anticipación');
      return res.status(400).json({
        error: `Solo se permiten reservas con hasta ${parametros.anticipacionMaximaDias} días de anticipación.`
      });
    }

    const capacidadTotal = parametros.capacidadFrente + parametros.capacidadGaleria + parametros.capacidadSalon;

    // Calcular personas reservadas para ese día y turno
    const fechaInicio = new Date(fechaReserva);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaReserva);
    fechaFin.setHours(23, 59, 59, 999);

    const reservas = await prisma.reserva.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        turno: turnoStr,
        estado: 'RESERVADA'
      }
    });

    console.log('[DEBUG] Reservas encontradas:', reservas.length);

    const personasReservadas = reservas.reduce((sum, r) => sum + r.cantidadPersonas, 0);
    const porcentajeOcupacion = Math.round((personasReservadas / capacidadTotal) * 100);
    const lugaresDisponibles = capacidadTotal - personasReservadas;

    // Calcular disponibilidad por zona
    const reservasPorZona = {
      FRENTE: reservas.filter(r => r.zona === 'FRENTE').reduce((sum, r) => sum + r.cantidadPersonas, 0),
      GALERIA: reservas.filter(r => r.zona === 'GALERIA').reduce((sum, r) => sum + r.cantidadPersonas, 0),
      SALON: reservas.filter(r => r.zona === 'SALON').reduce((sum, r) => sum + r.cantidadPersonas, 0)
    };

    res.json({
      fecha: fechaReserva.toISOString().split('T')[0],
      turno: turnoStr,
      capacidad: {
        total: capacidadTotal,
        frente: parametros.capacidadFrente,
        galeria: parametros.capacidadGaleria,
        salon: parametros.capacidadSalon
      },
      ocupacion: {
        personasReservadas,
        lugaresDisponibles,
        porcentajeOcupacion,
        porZona: {
          FRENTE: {
            reservadas: reservasPorZona.FRENTE,
            capacidad: parametros.capacidadFrente,
            disponibles: parametros.capacidadFrente - reservasPorZona.FRENTE
          },
          GALERIA: {
            reservadas: reservasPorZona.GALERIA,
            capacidad: parametros.capacidadGaleria,
            disponibles: parametros.capacidadGaleria - reservasPorZona.GALERIA
          },
          SALON: {
            reservadas: reservasPorZona.SALON,
            capacidad: parametros.capacidadSalon,
            disponibles: parametros.capacidadSalon - reservasPorZona.SALON
          }
        }
      },
      cantidadReservas: reservas.length
    });
  } catch (error) {
    console.error('[GET /reservas/disponibilidad] Error completo:', error);
    console.error('[GET /reservas/disponibilidad] Stack:', (error as any).stack);
    res.status(500).json({ 
      error: 'Error al obtener disponibilidad.',
      detalles: (error as any).message
    });
  }
});

// Crear nueva reserva
router.post('/', verificarToken, async (req: AuthRequest, res) => {
  try {
    const { fecha, turno, zona, cantidadPersonas, observaciones, clienteId } = req.body;
    const usuario = req.usuario!;

    console.log('[POST /reservas] Iniciando creación de reserva');
    console.log('[POST /reservas] Datos recibidos:', { fecha, turno, zona, cantidadPersonas, clienteId });

    // Determinar el cliente (para responsables pueden crear para otros)
    let clienteFinal = usuario.id;
    if (usuario.rol === 'RESPONSABLE' && clienteId) {
      clienteFinal = clienteId;
    }

    console.log('[POST /reservas] Cliente final:', clienteFinal, 'Usuario rol:', usuario.rol);

    // Validaciones básicas
    if (!fecha || !turno || !zona || !cantidadPersonas) {
      console.log('[POST /reservas] Validación fallida: falta fecha, turno, zona o cantidad');
      return res.status(400).json({
        error: 'Se requiere: fecha, turno, zona y cantidad de personas.'
      });
    }

    // Validar cantidad de personas
    const validacionCantidad = validarCantidadPersonas(cantidadPersonas);
    if (!validacionCantidad.valido) {
      console.log('[POST /reservas] Validación de cantidad fallida:', validacionCantidad.mensaje);
      return res.status(400).json({ error: validacionCantidad.mensaje });
    }

    const fechaReserva = parsearFechaISO(fecha);
    const turnoStr = turno as string;
    const zonaStr = zona as string;

    console.log('[POST /reservas] Fecha parseada:', fechaReserva.toISOString(), 'Turno:', turnoStr, 'Zona:', zonaStr);

    // Validar día de apertura
    if (!esDiaApertura(fechaReserva)) {
      const diaSemana = fechaReserva.getDay();
      console.log('[POST /reservas] El restaurante no abre ese día');
      return res.status(400).json({
        error: `El restaurante no abre los ${NOMBRES_DIAS[diaSemana]}. Abrimos de martes a sábado.`
      });
    }

    // Obtener parámetros
    const parametros = await prisma.parametrosCapacidadRestaurante.findFirst();
    if (!parametros) {
      console.log('[POST /reservas] Error: No se encontraron parámetros de capacidad');
      return res.status(500).json({ error: 'Error de configuración del restaurante.' });
    }

    console.log('[POST /reservas] Parámetros encontrados:', parametros);

    // Validar anticipación
    if (!estaEnRangoAnticipacion(fechaReserva, parametros.anticipacionMaximaDias)) {
      console.log('[POST /reservas] Fuera del rango de anticipación');
      return res.status(400).json({
        error: `Solo se permiten reservas con hasta ${parametros.anticipacionMaximaDias} días de anticipación.`
      });
    }

    const capacidadTotal = parametros.capacidadFrente + parametros.capacidadGaleria + parametros.capacidadSalon;

    // Calcular ocupación actual por zona
    const fechaInicio = new Date(fechaReserva);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaReserva);
    fechaFin.setHours(23, 59, 59, 999);

    console.log('[POST /reservas] Buscando reservas existentes en zona', zonaStr, 'para:', fechaInicio.toISOString(), '-', fechaFin.toISOString(), 'Turno:', turnoStr);

    // Buscar reservas existentes en la MISMA ZONA para esa fecha y turno
    const reservasEnZona = await prisma.reserva.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        turno: turnoStr,
        zona: zonaStr,
        estado: 'RESERVADA'
      }
    });

    console.log('[POST /reservas] Reservas en zona encontradas:', reservasEnZona.length);

    const personasYaReservadasEnZona = reservasEnZona.reduce((sum, r) => sum + r.cantidadPersonas, 0);

    console.log('[POST /reservas] Personas ya reservadas en zona', zonaStr, ':', personasYaReservadasEnZona);

    // Validar capacidad de la zona específica
    const validacionCapacidad = validarCapacidadZona(cantidadPersonas, personasYaReservadasEnZona, zonaStr);
    
    if (!validacionCapacidad.valido) {
      console.log('[POST /reservas] Capacidad insuficiente en zona:', validacionCapacidad.mensaje);
      
      return res.status(400).json({
        error: validacionCapacidad.mensaje,
        detalles: {
          zona: zonaStr,
          personasSolicitadas: cantidadPersonas,
          personasYaReservadas: personasYaReservadasEnZona,
          lugaresDisponibles: validacionCapacidad.disponibles
        }
      });
    }

    console.log('[POST /reservas] Capacidad validada. Lugares disponibles en zona:', validacionCapacidad.disponibles);

    // Crear la reserva
    const nuevaReserva = await prisma.reserva.create({
      data: {
        clienteId: clienteFinal,
        fecha: fechaReserva,
        turno: turnoStr,
        zona: zonaStr,
        cantidadPersonas,
        observaciones: observaciones || null,
        estado: 'RESERVADA'
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        }
      }
    });

    console.log('[POST /reservas] Reserva creada exitosamente. ID:', nuevaReserva.id);

    // Calcular ocupación total actualizada (incluyendo la nueva reserva)
    const todasLasReservas = await prisma.reserva.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        turno: turnoStr,
        estado: 'RESERVADA'
      }
    });

    const totalPersonasReservadas = todasLasReservas.reduce((sum, r) => sum + r.cantidadPersonas, 0);
    const nuevoPorcentaje = Math.round((totalPersonasReservadas / capacidadTotal) * 100);

    res.status(201).json({
      mensaje: '¡Reserva creada exitosamente!',
      reserva: {
        ...nuevaReserva,
        fecha: serializarFechaISO(nuevaReserva.fecha),
        fechaCreacion: serializarFechaISO(nuevaReserva.fechaCreacion),
        fechaUltimaModificacion: serializarFechaISO(nuevaReserva.fechaUltimaModificacion)
      },
      ocupacion: {
        porcentajeOcupacion: nuevoPorcentaje,
        personasReservadas: totalPersonasReservadas,
        capacidadTotal
      }
    });
  } catch (error) {
    console.error('[POST /reservas] Error al crear reserva:', error);
    res.status(500).json({ error: 'Error al crear la reserva.', detalles: (error as any).message });
  }
});

// Obtener reservas del cliente actual
router.get('/mis-reservas', verificarToken, async (req: AuthRequest, res) => {
  try {
    const usuario = req.usuario!;
    const { tipo } = req.query; // 'futuras', 'pasadas', 'todas'

    console.log('[GET /mis-reservas] Obteniendo reservas para usuario:', usuario.id, 'Tipo:', tipo);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let whereClause: any = {
      clienteId: usuario.id
    };

    if (tipo === 'futuras') {
      whereClause.fecha = { gte: hoy };
    } else if (tipo === 'pasadas') {
      whereClause.fecha = { lt: hoy };
    }

    console.log('[GET /mis-reservas] whereClause:', JSON.stringify(whereClause));

    const reservas = await prisma.reserva.findMany({
      where: whereClause,
      include: {
        comentarios: true
      },
      orderBy: {
        fecha: tipo === 'pasadas' ? 'desc' : 'asc'
      }
    });

    console.log('[GET /mis-reservas] Reservas encontradas:', reservas.length);

    // Agregar información de si se puede modificar y serializar fechas
    const reservasConInfo = reservas.map(reserva => ({
      ...reserva,
      fecha: serializarFechaISO(reserva.fecha),
      fechaCreacion: serializarFechaISO(reserva.fechaCreacion),
      fechaUltimaModificacion: serializarFechaISO(reserva.fechaUltimaModificacion),
      puedeModificar: esReservaFutura(reserva.fecha) && 
                       faltanMasDe24Horas(reserva.fecha, reserva.turno) &&
                       reserva.estado === 'RESERVADA',
      puedeCancelar: esReservaFutura(reserva.fecha) && 
                      faltanMasDe24Horas(reserva.fecha, reserva.turno) &&
                      reserva.estado === 'RESERVADA',
      esFutura: esReservaFutura(reserva.fecha)
    }));

    res.json({ reservas: reservasConInfo });
  } catch (error) {
    console.error('[GET /mis-reservas] Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas.' });
  }
});

// ============== RUTAS PARA RESPONSABLES (ANTES DE /:id) ==============

// Obtener todas las reservas (solo responsables)
router.get('/admin/todas', verificarToken, verificarResponsable, async (req: AuthRequest, res) => {
  try {
    const { fecha, turno, estado } = req.query;

    let whereClause: any = {};

    if (fecha) {
      const fechaFiltro = parsearFechaISO(fecha as string);
      const fechaInicio = new Date(fechaFiltro);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fechaFiltro);
      fechaFin.setHours(23, 59, 59, 999);
      
      whereClause.fecha = { gte: fechaInicio, lte: fechaFin };
    }

    if (turno) {
      whereClause.turno = turno as string;
    }

    if (estado) {
      whereClause.estado = estado as string;
    }

    const reservas = await prisma.reserva.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        },
        comentarios: true
      },
      orderBy: [
        { fecha: 'asc' },
        { turno: 'asc' }
      ]
    });

    // Serializar fechas correctamente
    const reservasSerializadas = reservas.map(r => ({
      ...r,
      fecha: serializarFechaISO(r.fecha),
      fechaCreacion: serializarFechaISO(r.fechaCreacion),
      fechaUltimaModificacion: serializarFechaISO(r.fechaUltimaModificacion)
    }));

    res.json({ reservas: reservasSerializadas });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas.' });
  }
});

// Obtener resumen de planificación (solo responsables)
router.get('/admin/planificacion', verificarToken, verificarResponsable, async (req: AuthRequest, res) => {
  try {
    const { fecha, turno } = req.query;

    if (!fecha || !turno) {
      return res.status(400).json({ error: 'Se requiere fecha y turno.' });
    }

    const fechaFiltro = parsearFechaISO(fecha as string);
    const fechaInicio = new Date(fechaFiltro);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaFiltro);
    fechaFin.setHours(23, 59, 59, 999);

    const reservas = await prisma.reserva.findMany({
      where: {
        fecha: { gte: fechaInicio, lte: fechaFin },
        turno: turno as string,
        estado: 'RESERVADA'
      },
      include: {
        cliente: {
          select: { nombre: true, apellido: true }
        }
      }
    });

    const parametros = await prisma.parametrosCapacidadRestaurante.findFirst();
    if (!parametros) {
      return res.status(500).json({ error: 'Error de configuración.' });
    }

    const capacidadTotal = parametros.capacidadFrente + parametros.capacidadGaleria + parametros.capacidadSalon;
    const totalPersonas = reservas.reduce((sum, r) => sum + r.cantidadPersonas, 0);
    const porcentajeOcupacion = Math.round((totalPersonas / capacidadTotal) * 100);

    // Agrupar por zona
    const porZona = reservas.reduce((acc: any, r) => {
      if (!acc[r.zona]) {
        acc[r.zona] = { reservas: 0, personas: 0, conObservaciones: 0 };
      }
      acc[r.zona].reservas++;
      acc[r.zona].personas += r.cantidadPersonas;
      if (r.observaciones) acc[r.zona].conObservaciones++;
      return acc;
    }, {});

    // Agrupar por tamaño de grupo
    const porTamano = reservas.reduce((acc: any, r) => {
      const rango = getRangoTamanoGrupo(r.cantidadPersonas);
      if (!acc[rango]) {
        acc[rango] = { reservas: 0, personas: 0, conObservaciones: 0 };
      }
      acc[rango].reservas++;
      acc[rango].personas += r.cantidadPersonas;
      if (r.observaciones) acc[rango].conObservaciones++;
      return acc;
    }, {});

    // Agrupar por zona y tamaño exacto (sin rangos)
    const porZonaYTamano = reservas.reduce((acc: any, r) => {
      const key = `${r.zona}-${r.cantidadPersonas}`;
      if (!acc[key]) {
        acc[key] = { zona: r.zona, tamano: r.cantidadPersonas.toString(), reservas: 0, personas: r.cantidadPersonas, conObservaciones: 0 };
      }
      acc[key].reservas++;
      if (r.observaciones) acc[key].conObservaciones++;
      return acc;
    }, {});

    res.json({
      fecha: fecha,
      turno: turno,
      resumen: {
        capacidadTotal,
        totalPersonas,
        porcentajeOcupacion,
        totalReservas: reservas.length,
        conObservaciones: reservas.filter(r => r.observaciones).length
      },
      porZona,
      porTamano,
      porZonaYTamano: Object.values(porZonaYTamano),
      capacidadPorZona: {
        FRENTE: parametros.capacidadFrente,
        GALERIA: parametros.capacidadGaleria,
        SALON: parametros.capacidadSalon
      }
    });
  } catch (error) {
    console.error('Error al obtener planificación:', error);
    res.status(500).json({ error: 'Error al obtener planificación.' });
  }
});

// Obtener una reserva específica
router.get('/:id', verificarToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario!;

    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        },
        comentarios: true
      }
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    // Verificar acceso
    if (usuario.rol !== 'RESPONSABLE' && reserva.clienteId !== usuario.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva.' });
    }

    res.json({
      reserva: {
        ...reserva,
        fecha: serializarFechaISO(reserva.fecha),
        fechaCreacion: serializarFechaISO(reserva.fechaCreacion),
        fechaUltimaModificacion: serializarFechaISO(reserva.fechaUltimaModificacion),
        puedeModificar: esReservaFutura(reserva.fecha) && 
                         faltanMasDe24Horas(reserva.fecha, reserva.turno) &&
                         reserva.estado === 'RESERVADA',
        puedeCancelar: esReservaFutura(reserva.fecha) && 
                        faltanMasDe24Horas(reserva.fecha, reserva.turno) &&
                        reserva.estado === 'RESERVADA',
        esFutura: esReservaFutura(reserva.fecha)
      }
    });
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).json({ error: 'Error al obtener la reserva.' });
  }
});

// Actualizar reserva
router.put('/:id', verificarToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { fecha, turno, zona, cantidadPersonas, observaciones } = req.body;
    const usuario = req.usuario!;

    const reservaExistente = await prisma.reserva.findUnique({
      where: { id: parseInt(id) }
    });

    if (!reservaExistente) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    // Verificar acceso (cliente solo sus reservas, responsable todas)
    if (usuario.rol !== 'RESPONSABLE' && reservaExistente.clienteId !== usuario.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva.' });
    }

    // Verificar si se puede modificar (solo clientes tienen restricción de 24h)
    if (usuario.rol === 'CLIENTE') {
      if (!esReservaFutura(reservaExistente.fecha)) {
        return res.status(400).json({ error: 'No se pueden modificar reservas pasadas.' });
      }
      
      if (!faltanMasDe24Horas(reservaExistente.fecha, reservaExistente.turno)) {
        return res.status(400).json({ 
          error: 'No se puede modificar la reserva con menos de 24 horas de anticipación. Por favor, contacta al restaurante.' 
        });
      }

      if (reservaExistente.estado !== 'RESERVADA') {
        return res.status(400).json({ error: 'Solo se pueden modificar reservas activas.' });
      }
    }

    // Preparar datos de actualización
    const datosActualizacion: any = {};
    
    if (fecha) {
      const nuevaFecha = parsearFechaISO(fecha);
      
      if (!esDiaApertura(nuevaFecha)) {
        const diaSemana = nuevaFecha.getDay();
        return res.status(400).json({
          error: `El restaurante no abre los ${NOMBRES_DIAS[diaSemana]}. Abrimos de martes a sábado.`
        });
      }

      const parametros = await prisma.parametrosCapacidadRestaurante.findFirst();
      if (parametros && !estaEnRangoAnticipacion(nuevaFecha, parametros.anticipacionMaximaDias)) {
        return res.status(400).json({
          error: `Solo se permiten reservas con hasta ${parametros.anticipacionMaximaDias} días de anticipación.`
        });
      }

      datosActualizacion.fecha = nuevaFecha;
    }

    if (turno) datosActualizacion.turno = turno as string;
    if (zona) datosActualizacion.zona = zona as string;
    if (cantidadPersonas !== undefined) {
      const validacion = validarCantidadPersonas(cantidadPersonas);
      if (!validacion.valido) {
        return res.status(400).json({ error: validacion.mensaje });
      }
      datosActualizacion.cantidadPersonas = cantidadPersonas;
    }
    if (observaciones !== undefined) datosActualizacion.observaciones = observaciones;

    // Validar capacidad si cambia la fecha, turno, zona o cantidad
    if (datosActualizacion.fecha || datosActualizacion.turno || datosActualizacion.zona || datosActualizacion.cantidadPersonas) {
      const fechaValidar = datosActualizacion.fecha || reservaExistente.fecha;
      const turnoValidar = datosActualizacion.turno || reservaExistente.turno;
      const zonaValidar = datosActualizacion.zona || reservaExistente.zona;
      const cantidadValidar = datosActualizacion.cantidadPersonas || reservaExistente.cantidadPersonas;

      const parametros = await prisma.parametrosCapacidadRestaurante.findFirst();
      if (!parametros) {
        return res.status(500).json({ error: 'Error de configuración.' });
      }

      const fechaInicio = new Date(fechaValidar);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fechaValidar);
      fechaFin.setHours(23, 59, 59, 999);

      // Buscar reservas en la MISMA ZONA para esa fecha y turno (excluyendo la actual)
      const otrasReservasEnZona = await prisma.reserva.findMany({
        where: {
          fecha: { gte: fechaInicio, lte: fechaFin },
          turno: turnoValidar,
          zona: zonaValidar,
          estado: 'RESERVADA',
          id: { not: reservaExistente.id }
        }
      });

      const personasYaReservadasEnZona = otrasReservasEnZona.reduce((sum, r) => sum + r.cantidadPersonas, 0);

      // Validar capacidad de la zona
      const validacionCapacidad = validarCapacidadZona(cantidadValidar, personasYaReservadasEnZona, zonaValidar);
      
      if (!validacionCapacidad.valido) {
        return res.status(400).json({
          error: validacionCapacidad.mensaje,
          detalles: {
            zona: zonaValidar,
            personasSolicitadas: cantidadValidar,
            personasYaReservadas: personasYaReservadasEnZona,
            lugaresDisponibles: validacionCapacidad.disponibles
          }
        });
      }
    }

    const reservaActualizada = await prisma.reserva.update({
      where: { id: parseInt(id) },
      data: datosActualizacion,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        }
      }
    });

    res.json({
      mensaje: 'Reserva actualizada correctamente.',
      reserva: {
        ...reservaActualizada,
        fecha: serializarFechaISO(reservaActualizada.fecha),
        fechaCreacion: serializarFechaISO(reservaActualizada.fechaCreacion),
        fechaUltimaModificacion: serializarFechaISO(reservaActualizada.fechaUltimaModificacion)
      }
    });
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    res.status(500).json({ error: 'Error al actualizar la reserva.' });
  }
});

// Cancelar reserva
router.put('/:id/cancelar', verificarToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario!;

    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(id) }
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    // Verificar acceso
    if (usuario.rol !== 'RESPONSABLE' && reserva.clienteId !== usuario.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva.' });
    }

    // Verificar estado
    if (reserva.estado !== 'RESERVADA') {
      return res.status(400).json({ error: 'Esta reserva ya está cancelada.' });
    }

    // Clientes solo pueden cancelar con 24h de anticipación
    if (usuario.rol === 'CLIENTE') {
      if (!esReservaFutura(reserva.fecha)) {
        return res.status(400).json({ error: 'No se pueden cancelar reservas pasadas.' });
      }

      if (!faltanMasDe24Horas(reserva.fecha, reserva.turno)) {
        return res.status(400).json({
          error: 'No se puede cancelar la reserva con menos de 24 horas de anticipación. Por favor, contacta al restaurante.'
        });
      }
    }

    // Determinar estado de cancelación
    const nuevoEstado = usuario.rol === 'RESPONSABLE' 
      ? 'CANCELADA_POR_RESTAURANTE' 
      : 'CANCELADA_POR_CLIENTE';

    const reservaCancelada = await prisma.reserva.update({
      where: { id: parseInt(id) },
      data: { estado: nuevoEstado }
    });

    res.json({
      mensaje: 'Reserva cancelada correctamente.',
      reserva: {
        ...reservaCancelada,
        fecha: serializarFechaISO(reservaCancelada.fecha),
        fechaCreacion: serializarFechaISO(reservaCancelada.fechaCreacion),
        fechaUltimaModificacion: serializarFechaISO(reservaCancelada.fechaUltimaModificacion)
      }
    });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar la reserva.' });
  }
});


export default router;
