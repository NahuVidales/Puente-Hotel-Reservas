"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOMBRES_DIAS = exports.CAPACIDADES_ZONA = exports.DIAS_APERTURA = void 0;
exports.parsearFechaISO = parsearFechaISO;
exports.esDiaApertura = esDiaApertura;
exports.estaEnRangoAnticipacion = estaEnRangoAnticipacion;
exports.faltanMasDe24Horas = faltanMasDe24Horas;
exports.esReservaFutura = esReservaFutura;
exports.esReservaPasada = esReservaPasada;
exports.formatearFecha = formatearFecha;
exports.getNombreTurno = getNombreTurno;
exports.getNombreZona = getNombreZona;
exports.validarCantidadPersonas = validarCantidadPersonas;
exports.getRangoTamanoGrupo = getRangoTamanoGrupo;
exports.serializarFechaISO = serializarFechaISO;
exports.validarCapacidadZona = validarCapacidadZona;
// Días de apertura del restaurante (0 = Domingo, 1 = Lunes, etc.)
// Martes (2) a Sábado (6)
exports.DIAS_APERTURA = [2, 3, 4, 5, 6];
// Capacidad máxima por zona (personas)
exports.CAPACIDADES_ZONA = {
    FRENTE: 30,
    GALERIA: 200,
    SALON: 500
};
exports.NOMBRES_DIAS = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
};
// Parsear fecha ISO (YYYY-MM-DD) a Date local sin desfase de zona horaria
function parsearFechaISO(fechaStr) {
    const [año, mes, día] = fechaStr.split('-').map(Number);
    const fecha = new Date(año, mes - 1, día);
    fecha.setHours(0, 0, 0, 0);
    return fecha;
}
// Verificar si es un día de apertura válido
function esDiaApertura(fecha) {
    const diaSemana = fecha.getDay();
    return exports.DIAS_APERTURA.includes(diaSemana);
}
// Verificar si la fecha está dentro del rango de anticipación
function estaEnRangoAnticipacion(fecha, anticipacionMaximaDias) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaReserva = new Date(fecha);
    fechaReserva.setHours(0, 0, 0, 0);
    const fechaMaxima = new Date(hoy);
    fechaMaxima.setDate(fechaMaxima.getDate() + anticipacionMaximaDias);
    return fechaReserva >= hoy && fechaReserva <= fechaMaxima;
}
// Verificar si faltan más de 24 horas para el turno
function faltanMasDe24Horas(fecha, turno) {
    const ahora = new Date();
    const fechaReserva = new Date(fecha);
    // Establecer hora aproximada del turno
    if (turno === 'ALMUERZO') {
        fechaReserva.setHours(12, 0, 0, 0); // Mediodía para almuerzo
    }
    else {
        fechaReserva.setHours(20, 0, 0, 0); // 8 PM para cena
    }
    const diferenciaMs = fechaReserva.getTime() - ahora.getTime();
    const horasRestantes = diferenciaMs / (1000 * 60 * 60);
    return horasRestantes > 24;
}
// Verificar si es una reserva futura
function esReservaFutura(fecha) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaReserva = new Date(fecha);
    fechaReserva.setHours(0, 0, 0, 0);
    return fechaReserva >= hoy;
}
// Verificar si es una reserva pasada
function esReservaPasada(fecha) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaReserva = new Date(fecha);
    fechaReserva.setHours(0, 0, 0, 0);
    return fechaReserva < hoy;
}
// Formatear fecha para mostrar
function formatearFecha(fecha) {
    return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
// Obtener nombre del turno
function getNombreTurno(turno) {
    return turno === 'ALMUERZO' ? 'Almuerzo' : 'Cena';
}
// Obtener nombre de la zona
function getNombreZona(zona) {
    const nombres = {
        FRENTE: 'Frente',
        GALERIA: 'Galería',
        SALON: 'Salón'
    };
    return nombres[zona] || zona;
}
// Validar cantidad de personas
function validarCantidadPersonas(cantidad) {
    if (!Number.isInteger(cantidad)) {
        return { valido: false, mensaje: 'La cantidad de personas debe ser un número entero.' };
    }
    if (cantidad < 1) {
        return { valido: false, mensaje: 'La cantidad de personas debe ser al menos 1.' };
    }
    if (cantidad > 50) {
        return { valido: false, mensaje: 'Para grupos mayores a 50 personas, por favor contacte directamente al restaurante.' };
    }
    return { valido: true };
}
// Obtener rango de tamaño de grupo para reportes
function getRangoTamanoGrupo(cantidad) {
    if (cantidad <= 2)
        return '1-2';
    if (cantidad <= 4)
        return '3-4';
    if (cantidad <= 6)
        return '5-6';
    return '7+';
}
// Convertir Date a string ISO local (YYYY-MM-DD) sin desfase de zona horaria
function serializarFechaISO(fecha) {
    let date;
    if (typeof fecha === 'string') {
        // Si ya es string, devolverlo como está
        return fecha;
    }
    date = new Date(fecha);
    date.setHours(0, 0, 0, 0);
    const año = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const día = String(date.getDate()).padStart(2, '0');
    return `${año}-${mes}-${día}`;
}
// Validar capacidad disponible en una zona para fecha + turno
// Retorna { valido: boolean, disponibles: number, mensaje?: string }
function validarCapacidadZona(personasSolicitadas, personasYaReservadas, zona) {
    const capacidadMaxima = exports.CAPACIDADES_ZONA[zona];
    if (!capacidadMaxima) {
        return {
            valido: false,
            disponibles: 0,
            mensaje: `Zona desconocida: ${zona}`
        };
    }
    const disponibles = capacidadMaxima - personasYaReservadas;
    if (personasSolicitadas > disponibles) {
        return {
            valido: false,
            disponibles,
            mensaje: `No hay capacidad suficiente en ${getNombreZona(zona)} para esa cantidad de personas. Lugares disponibles: ${disponibles}.`
        };
    }
    return {
        valido: true,
        disponibles
    };
}
//# sourceMappingURL=validaciones.js.map