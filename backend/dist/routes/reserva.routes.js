"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("../index");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validaciones_1 = require("../utils/validaciones");
const router = (0, express_1.Router)();
// Obtener disponibilidad para una fecha y turno
router.get('/disponibilidad', auth_middleware_1.verificarToken, async (req, res) => {
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
        const fechaReserva = (0, validaciones_1.parsearFechaISO)(fecha);
        console.log('[GET /reservas/disponibilidad] Fecha string recibida:', fecha);
        console.log('[GET /reservas/disponibilidad] Fecha parseada:', fechaReserva.toISOString());
        console.log('[GET /reservas/disponibilidad] getDay():', fechaReserva.getDay());
        console.log('[GET /reservas/disponibilidad] DIAS_APERTURA:', validaciones_1.DIAS_APERTURA);
        console.log('[GET /reservas/disponibilidad] Turno normalizado:', turnoStr);
        // Validar día de apertura
        if (!(0, validaciones_1.esDiaApertura)(fechaReserva)) {
            const diaSemana = fechaReserva.getDay();
            console.log('[GET /reservas/disponibilidad] Día de semana rechazado:', diaSemana, validaciones_1.NOMBRES_DIAS[diaSemana]);
            return res.status(400).json({
                error: `El restaurante no abre los ${validaciones_1.NOMBRES_DIAS[diaSemana]}. Abrimos de martes a sábado.`
            });
        }
        // Obtener parámetros de capacidad
        const parametros = await index_1.prisma.parametrosCapacidadRestaurante.findFirst();
        if (!parametros) {
            console.log('[GET /reservas/disponibilidad] Parámetros de capacidad no encontrados');
            return res.status(500).json({ error: 'Error de configuración del restaurante.' });
        }
        // Validar rango de anticipación
        if (!(0, validaciones_1.estaEnRangoAnticipacion)(fechaReserva, parametros.anticipacionMaximaDias)) {
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
        const reservas = await index_1.prisma.reserva.findMany({
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
    }
    catch (error) {
        console.error('[GET /reservas/disponibilidad] Error completo:', error);
        console.error('[GET /reservas/disponibilidad] Stack:', error.stack);
        res.status(500).json({
            error: 'Error al obtener disponibilidad.',
            detalles: error.message
        });
    }
});
// Crear nueva reserva
router.post('/', auth_middleware_1.verificarToken, async (req, res) => {
    try {
        const { fecha, turno, zona, cantidadPersonas, observaciones, clienteId } = req.body;
        const usuario = req.usuario;
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
        const validacionCantidad = (0, validaciones_1.validarCantidadPersonas)(cantidadPersonas);
        if (!validacionCantidad.valido) {
            console.log('[POST /reservas] Validación de cantidad fallida:', validacionCantidad.mensaje);
            return res.status(400).json({ error: validacionCantidad.mensaje });
        }
        const fechaReserva = (0, validaciones_1.parsearFechaISO)(fecha);
        const turnoStr = turno;
        const zonaStr = zona;
        console.log('[POST /reservas] Fecha parseada:', fechaReserva.toISOString(), 'Turno:', turnoStr, 'Zona:', zonaStr);
        // Validar día de apertura
        if (!(0, validaciones_1.esDiaApertura)(fechaReserva)) {
            const diaSemana = fechaReserva.getDay();
            console.log('[POST /reservas] El restaurante no abre ese día');
            return res.status(400).json({
                error: `El restaurante no abre los ${validaciones_1.NOMBRES_DIAS[diaSemana]}. Abrimos de martes a sábado.`
            });
        }
        // Obtener parámetros
        const parametros = await index_1.prisma.parametrosCapacidadRestaurante.findFirst();
        if (!parametros) {
            console.log('[POST /reservas] Error: No se encontraron parámetros de capacidad');
            return res.status(500).json({ error: 'Error de configuración del restaurante.' });
        }
        console.log('[POST /reservas] Parámetros encontrados:', parametros);
        // Validar anticipación
        if (!(0, validaciones_1.estaEnRangoAnticipacion)(fechaReserva, parametros.anticipacionMaximaDias)) {
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
        const reservasEnZona = await index_1.prisma.reserva.findMany({
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
        const validacionCapacidad = (0, validaciones_1.validarCapacidadZona)(cantidadPersonas, personasYaReservadasEnZona, zonaStr);
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
        const nuevaReserva = await index_1.prisma.reserva.create({
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
        const todasLasReservas = await index_1.prisma.reserva.findMany({
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
                fecha: (0, validaciones_1.serializarFechaISO)(nuevaReserva.fecha),
                fechaCreacion: (0, validaciones_1.serializarFechaISO)(nuevaReserva.fechaCreacion),
                fechaUltimaModificacion: (0, validaciones_1.serializarFechaISO)(nuevaReserva.fechaUltimaModificacion)
            },
            ocupacion: {
                porcentajeOcupacion: nuevoPorcentaje,
                personasReservadas: totalPersonasReservadas,
                capacidadTotal
            }
        });
    }
    catch (error) {
        console.error('[POST /reservas] Error al crear reserva:', error);
        res.status(500).json({ error: 'Error al crear la reserva.', detalles: error.message });
    }
});
// Obtener reservas del cliente actual
router.get('/mis-reservas', auth_middleware_1.verificarToken, async (req, res) => {
    try {
        const usuario = req.usuario;
        const { tipo } = req.query; // 'futuras', 'pasadas', 'todas'
        console.log('[GET /mis-reservas] Obteniendo reservas para usuario:', usuario.id, 'Tipo:', tipo);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        let whereClause = {
            clienteId: usuario.id
        };
        if (tipo === 'futuras') {
            whereClause.fecha = { gte: hoy };
        }
        else if (tipo === 'pasadas') {
            whereClause.fecha = { lt: hoy };
        }
        console.log('[GET /mis-reservas] whereClause:', JSON.stringify(whereClause));
        const reservas = await index_1.prisma.reserva.findMany({
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
            fecha: (0, validaciones_1.serializarFechaISO)(reserva.fecha),
            fechaCreacion: (0, validaciones_1.serializarFechaISO)(reserva.fechaCreacion),
            fechaUltimaModificacion: (0, validaciones_1.serializarFechaISO)(reserva.fechaUltimaModificacion),
            puedeModificar: (0, validaciones_1.esReservaFutura)(reserva.fecha) &&
                (0, validaciones_1.faltanMasDe24Horas)(reserva.fecha, reserva.turno) &&
                reserva.estado === 'RESERVADA',
            puedeCancelar: (0, validaciones_1.esReservaFutura)(reserva.fecha) &&
                (0, validaciones_1.faltanMasDe24Horas)(reserva.fecha, reserva.turno) &&
                reserva.estado === 'RESERVADA',
            esFutura: (0, validaciones_1.esReservaFutura)(reserva.fecha)
        }));
        res.json({ reservas: reservasConInfo });
    }
    catch (error) {
        console.error('[GET /mis-reservas] Error al obtener reservas:', error);
        res.status(500).json({ error: 'Error al obtener reservas.' });
    }
});
// ============== RUTAS PARA RESPONSABLES (ANTES DE /:id) ==============
// Obtener todas las reservas (solo responsables)
router.get('/admin/todas', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const { fecha, turno, estado } = req.query;
        let whereClause = {};
        if (fecha) {
            const fechaFiltro = (0, validaciones_1.parsearFechaISO)(fecha);
            const fechaInicio = new Date(fechaFiltro);
            fechaInicio.setHours(0, 0, 0, 0);
            const fechaFin = new Date(fechaFiltro);
            fechaFin.setHours(23, 59, 59, 999);
            whereClause.fecha = { gte: fechaInicio, lte: fechaFin };
        }
        if (turno) {
            whereClause.turno = turno;
        }
        if (estado) {
            whereClause.estado = estado;
        }
        const reservas = await index_1.prisma.reserva.findMany({
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
            fecha: (0, validaciones_1.serializarFechaISO)(r.fecha),
            fechaCreacion: (0, validaciones_1.serializarFechaISO)(r.fechaCreacion),
            fechaUltimaModificacion: (0, validaciones_1.serializarFechaISO)(r.fechaUltimaModificacion)
        }));
        res.json({ reservas: reservasSerializadas });
    }
    catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ error: 'Error al obtener reservas.' });
    }
});
// Obtener resumen de planificación (solo responsables)
router.get('/admin/planificacion', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const { fecha, turno } = req.query;
        if (!fecha || !turno) {
            return res.status(400).json({ error: 'Se requiere fecha y turno.' });
        }
        const fechaFiltro = (0, validaciones_1.parsearFechaISO)(fecha);
        const fechaInicio = new Date(fechaFiltro);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = new Date(fechaFiltro);
        fechaFin.setHours(23, 59, 59, 999);
        const reservas = await index_1.prisma.reserva.findMany({
            where: {
                fecha: { gte: fechaInicio, lte: fechaFin },
                turno: turno,
                estado: 'RESERVADA'
            },
            include: {
                cliente: {
                    select: { nombre: true, apellido: true }
                }
            }
        });
        const parametros = await index_1.prisma.parametrosCapacidadRestaurante.findFirst();
        if (!parametros) {
            return res.status(500).json({ error: 'Error de configuración.' });
        }
        const capacidadTotal = parametros.capacidadFrente + parametros.capacidadGaleria + parametros.capacidadSalon;
        const totalPersonas = reservas.reduce((sum, r) => sum + r.cantidadPersonas, 0);
        const porcentajeOcupacion = Math.round((totalPersonas / capacidadTotal) * 100);
        // Agrupar por zona
        const porZona = reservas.reduce((acc, r) => {
            if (!acc[r.zona]) {
                acc[r.zona] = { reservas: 0, personas: 0, conObservaciones: 0 };
            }
            acc[r.zona].reservas++;
            acc[r.zona].personas += r.cantidadPersonas;
            if (r.observaciones)
                acc[r.zona].conObservaciones++;
            return acc;
        }, {});
        // Agrupar por tamaño de grupo
        const porTamano = reservas.reduce((acc, r) => {
            const rango = (0, validaciones_1.getRangoTamanoGrupo)(r.cantidadPersonas);
            if (!acc[rango]) {
                acc[rango] = { reservas: 0, personas: 0, conObservaciones: 0 };
            }
            acc[rango].reservas++;
            acc[rango].personas += r.cantidadPersonas;
            if (r.observaciones)
                acc[rango].conObservaciones++;
            return acc;
        }, {});
        // Agrupar por zona y tamaño exacto (sin rangos)
        const porZonaYTamano = reservas.reduce((acc, r) => {
            const key = `${r.zona}-${r.cantidadPersonas}`;
            if (!acc[key]) {
                acc[key] = { zona: r.zona, tamano: r.cantidadPersonas.toString(), reservas: 0, personas: r.cantidadPersonas, conObservaciones: 0 };
            }
            acc[key].reservas++;
            if (r.observaciones)
                acc[key].conObservaciones++;
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
    }
    catch (error) {
        console.error('Error al obtener planificación:', error);
        res.status(500).json({ error: 'Error al obtener planificación.' });
    }
});
// Obtener una reserva específica
router.get('/:id', auth_middleware_1.verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;
        const reserva = await index_1.prisma.reserva.findUnique({
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
                fecha: (0, validaciones_1.serializarFechaISO)(reserva.fecha),
                fechaCreacion: (0, validaciones_1.serializarFechaISO)(reserva.fechaCreacion),
                fechaUltimaModificacion: (0, validaciones_1.serializarFechaISO)(reserva.fechaUltimaModificacion),
                puedeModificar: (0, validaciones_1.esReservaFutura)(reserva.fecha) &&
                    (0, validaciones_1.faltanMasDe24Horas)(reserva.fecha, reserva.turno) &&
                    reserva.estado === 'RESERVADA',
                puedeCancelar: (0, validaciones_1.esReservaFutura)(reserva.fecha) &&
                    (0, validaciones_1.faltanMasDe24Horas)(reserva.fecha, reserva.turno) &&
                    reserva.estado === 'RESERVADA',
                esFutura: (0, validaciones_1.esReservaFutura)(reserva.fecha)
            }
        });
    }
    catch (error) {
        console.error('Error al obtener reserva:', error);
        res.status(500).json({ error: 'Error al obtener la reserva.' });
    }
});
// Actualizar reserva
router.put('/:id', auth_middleware_1.verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, turno, zona, cantidadPersonas, observaciones } = req.body;
        const usuario = req.usuario;
        const reservaExistente = await index_1.prisma.reserva.findUnique({
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
            if (!(0, validaciones_1.esReservaFutura)(reservaExistente.fecha)) {
                return res.status(400).json({ error: 'No se pueden modificar reservas pasadas.' });
            }
            if (!(0, validaciones_1.faltanMasDe24Horas)(reservaExistente.fecha, reservaExistente.turno)) {
                return res.status(400).json({
                    error: 'No se puede modificar la reserva con menos de 24 horas de anticipación. Por favor, contacta al restaurante.'
                });
            }
            if (reservaExistente.estado !== 'RESERVADA') {
                return res.status(400).json({ error: 'Solo se pueden modificar reservas activas.' });
            }
        }
        // Preparar datos de actualización
        const datosActualizacion = {};
        if (fecha) {
            const nuevaFecha = (0, validaciones_1.parsearFechaISO)(fecha);
            if (!(0, validaciones_1.esDiaApertura)(nuevaFecha)) {
                const diaSemana = nuevaFecha.getDay();
                return res.status(400).json({
                    error: `El restaurante no abre los ${validaciones_1.NOMBRES_DIAS[diaSemana]}. Abrimos de martes a sábado.`
                });
            }
            const parametros = await index_1.prisma.parametrosCapacidadRestaurante.findFirst();
            if (parametros && !(0, validaciones_1.estaEnRangoAnticipacion)(nuevaFecha, parametros.anticipacionMaximaDias)) {
                return res.status(400).json({
                    error: `Solo se permiten reservas con hasta ${parametros.anticipacionMaximaDias} días de anticipación.`
                });
            }
            datosActualizacion.fecha = nuevaFecha;
        }
        if (turno)
            datosActualizacion.turno = turno;
        if (zona)
            datosActualizacion.zona = zona;
        if (cantidadPersonas !== undefined) {
            const validacion = (0, validaciones_1.validarCantidadPersonas)(cantidadPersonas);
            if (!validacion.valido) {
                return res.status(400).json({ error: validacion.mensaje });
            }
            datosActualizacion.cantidadPersonas = cantidadPersonas;
        }
        if (observaciones !== undefined)
            datosActualizacion.observaciones = observaciones;
        // Validar capacidad si cambia la fecha, turno, zona o cantidad
        if (datosActualizacion.fecha || datosActualizacion.turno || datosActualizacion.zona || datosActualizacion.cantidadPersonas) {
            const fechaValidar = datosActualizacion.fecha || reservaExistente.fecha;
            const turnoValidar = datosActualizacion.turno || reservaExistente.turno;
            const zonaValidar = datosActualizacion.zona || reservaExistente.zona;
            const cantidadValidar = datosActualizacion.cantidadPersonas || reservaExistente.cantidadPersonas;
            const parametros = await index_1.prisma.parametrosCapacidadRestaurante.findFirst();
            if (!parametros) {
                return res.status(500).json({ error: 'Error de configuración.' });
            }
            const fechaInicio = new Date(fechaValidar);
            fechaInicio.setHours(0, 0, 0, 0);
            const fechaFin = new Date(fechaValidar);
            fechaFin.setHours(23, 59, 59, 999);
            // Buscar reservas en la MISMA ZONA para esa fecha y turno (excluyendo la actual)
            const otrasReservasEnZona = await index_1.prisma.reserva.findMany({
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
            const validacionCapacidad = (0, validaciones_1.validarCapacidadZona)(cantidadValidar, personasYaReservadasEnZona, zonaValidar);
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
        const reservaActualizada = await index_1.prisma.reserva.update({
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
                fecha: (0, validaciones_1.serializarFechaISO)(reservaActualizada.fecha),
                fechaCreacion: (0, validaciones_1.serializarFechaISO)(reservaActualizada.fechaCreacion),
                fechaUltimaModificacion: (0, validaciones_1.serializarFechaISO)(reservaActualizada.fechaUltimaModificacion)
            }
        });
    }
    catch (error) {
        console.error('Error al actualizar reserva:', error);
        res.status(500).json({ error: 'Error al actualizar la reserva.' });
    }
});
// Cancelar reserva
router.put('/:id/cancelar', auth_middleware_1.verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;
        const reserva = await index_1.prisma.reserva.findUnique({
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
            if (!(0, validaciones_1.esReservaFutura)(reserva.fecha)) {
                return res.status(400).json({ error: 'No se pueden cancelar reservas pasadas.' });
            }
            if (!(0, validaciones_1.faltanMasDe24Horas)(reserva.fecha, reserva.turno)) {
                return res.status(400).json({
                    error: 'No se puede cancelar la reserva con menos de 24 horas de anticipación. Por favor, contacta al restaurante.'
                });
            }
        }
        // Determinar estado de cancelación
        const nuevoEstado = usuario.rol === 'RESPONSABLE'
            ? 'CANCELADA_POR_RESTAURANTE'
            : 'CANCELADA_POR_CLIENTE';
        const reservaCancelada = await index_1.prisma.reserva.update({
            where: { id: parseInt(id) },
            data: { estado: nuevoEstado }
        });
        res.json({
            mensaje: 'Reserva cancelada correctamente.',
            reserva: {
                ...reservaCancelada,
                fecha: (0, validaciones_1.serializarFechaISO)(reservaCancelada.fecha),
                fechaCreacion: (0, validaciones_1.serializarFechaISO)(reservaCancelada.fechaCreacion),
                fechaUltimaModificacion: (0, validaciones_1.serializarFechaISO)(reservaCancelada.fechaUltimaModificacion)
            }
        });
    }
    catch (error) {
        console.error('Error al cancelar reserva:', error);
        res.status(500).json({ error: 'Error al cancelar la reserva.' });
    }
});
// Crear cliente nuevo + reserva (operación atómica)
// POST /reservas/con-cliente-nuevo
router.post('/con-cliente-nuevo', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const { nombre, apellido, telefono, email, password, fecha, turno, zona, cantidadPersonas, observaciones } = req.body;
        console.log('[POST /reservas/con-cliente-nuevo] Iniciando creación de cliente + reserva');
        console.log('[POST /reservas/con-cliente-nuevo] Cliente:', { nombre, apellido, telefono, email });
        // Validaciones básicas
        if (!nombre || !apellido || !telefono || !email || !password) {
            return res.status(400).json({
                error: 'Se requieren todos los datos del cliente: nombre, apellido, teléfono, email y contraseña.'
            });
        }
        if (!fecha || !turno || !zona || !cantidadPersonas) {
            return res.status(400).json({
                error: 'Se requieren todos los datos de la reserva: fecha, turno, zona y cantidad de personas.'
            });
        }
        // Validar cantidad de personas
        const validacionCantidad = (0, validaciones_1.validarCantidadPersonas)(cantidadPersonas);
        if (!validacionCantidad.valido) {
            return res.status(400).json({ error: validacionCantidad.mensaje });
        }
        // Validar longitud de contraseña
        if (password.length < 4) {
            return res.status(400).json({
                error: 'La contraseña debe tener al menos 4 caracteres.'
            });
        }
        // Validar formato de email (básico)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'El email debe ser válido (ejemplo: usuario@dominio.com)'
            });
        }
        // Verificar que el email sea único
        const usuarioExistente = await index_1.prisma.usuario.findUnique({
            where: { email }
        });
        if (usuarioExistente) {
            console.log('[POST /reservas/con-cliente-nuevo] Email ya existe:', email);
            return res.status(400).json({
                error: 'El email ya existe. Elegí un email distinto.'
            });
        }
        // Validar fecha y turno de la reserva
        const fechaReserva = (0, validaciones_1.parsearFechaISO)(fecha);
        const turnoStr = turno;
        const zonaStr = zona;
        if (!(0, validaciones_1.esDiaApertura)(fechaReserva)) {
            const diaSemana = fechaReserva.getDay();
            return res.status(400).json({
                error: `El restaurante no abre los ${validaciones_1.NOMBRES_DIAS[diaSemana]}. Abrimos de martes a sábado.`
            });
        }
        // Obtener parámetros
        const parametros = await index_1.prisma.parametrosCapacidadRestaurante.findFirst();
        if (!parametros) {
            return res.status(500).json({ error: 'Error de configuración del restaurante.' });
        }
        if (!(0, validaciones_1.estaEnRangoAnticipacion)(fechaReserva, parametros.anticipacionMaximaDias)) {
            return res.status(400).json({
                error: `Solo se permiten reservas con hasta ${parametros.anticipacionMaximaDias} días de anticipación.`
            });
        }
        // Calcular ocupación actual por zona
        const fechaInicio = new Date(fechaReserva);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = new Date(fechaReserva);
        fechaFin.setHours(23, 59, 59, 999);
        const reservasEnZona = await index_1.prisma.reserva.findMany({
            where: {
                fecha: { gte: fechaInicio, lte: fechaFin },
                turno: turnoStr,
                zona: zonaStr,
                estado: 'RESERVADA'
            }
        });
        const personasYaReservadasEnZona = reservasEnZona.reduce((sum, r) => sum + r.cantidadPersonas, 0);
        // Validar capacidad de la zona
        const validacionCapacidad = (0, validaciones_1.validarCapacidadZona)(cantidadPersonas, personasYaReservadasEnZona, zonaStr);
        if (!validacionCapacidad.valido) {
            console.log('[POST /reservas/con-cliente-nuevo] Capacidad insuficiente:', validacionCapacidad.mensaje);
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
        // ✅ OPERACIÓN ATÓMICA: Crear cliente y reserva en transacción
        console.log('[POST /reservas/con-cliente-nuevo] Iniciando transacción para crear cliente + reserva');
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const result = await index_1.prisma.$transaction(async (tx) => {
            // 1. Crear el usuario (cliente)
            const nuevoCliente = await tx.usuario.create({
                data: {
                    nombre,
                    apellido,
                    telefono,
                    email,
                    passwordHash,
                    rol: 'CLIENTE'
                }
            });
            console.log('[POST /reservas/con-cliente-nuevo] Cliente creado. ID:', nuevoCliente.id);
            // 2. Crear la reserva asociada al cliente
            const nuevaReserva = await tx.reserva.create({
                data: {
                    clienteId: nuevoCliente.id,
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
            console.log('[POST /reservas/con-cliente-nuevo] Reserva creada. ID:', nuevaReserva.id);
            return { cliente: nuevoCliente, reserva: nuevaReserva };
        });
        // Calcular ocupación global actualizada
        const todasLasReservas = await index_1.prisma.reserva.findMany({
            where: {
                fecha: { gte: fechaInicio, lte: fechaFin },
                turno: turnoStr,
                estado: 'RESERVADA'
            }
        });
        const capacidadTotal = parametros.capacidadFrente + parametros.capacidadGaleria + parametros.capacidadSalon;
        const totalPersonasReservadas = todasLasReservas.reduce((sum, r) => sum + r.cantidadPersonas, 0);
        const nuevoPorcentaje = Math.round((totalPersonasReservadas / capacidadTotal) * 100);
        console.log('[POST /reservas/con-cliente-nuevo] Operación completada exitosamente');
        res.status(201).json({
            mensaje: '¡Cliente y reserva creados exitosamente!',
            cliente: {
                id: result.cliente.id,
                nombre: result.cliente.nombre,
                apellido: result.cliente.apellido,
                telefono: result.cliente.telefono,
                email: result.cliente.email,
                rol: result.cliente.rol
            },
            reserva: {
                ...result.reserva,
                fecha: (0, validaciones_1.serializarFechaISO)(result.reserva.fecha),
                fechaCreacion: (0, validaciones_1.serializarFechaISO)(result.reserva.fechaCreacion),
                fechaUltimaModificacion: (0, validaciones_1.serializarFechaISO)(result.reserva.fechaUltimaModificacion)
            },
            ocupacion: {
                porcentajeOcupacion: nuevoPorcentaje,
                personasReservadas: totalPersonasReservadas,
                capacidadTotal
            }
        });
    }
    catch (error) {
        console.error('[POST /reservas/con-cliente-nuevo] Error:', error);
        // Si el error es de unicidad de email, devolver mensaje específico
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(400).json({
                error: 'El email ya existe. Elegí un email distinto.'
            });
        }
        res.status(500).json({ error: 'Error al crear cliente y reserva.' });
    }
});
exports.default = router;
//# sourceMappingURL=reserva.routes.js.map