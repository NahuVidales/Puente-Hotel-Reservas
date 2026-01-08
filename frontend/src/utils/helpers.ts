import { DIAS_APERTURA, DIAS_SEMANA, Turno, Zona, EstadoReserva } from '../types';

// Formatear fecha para mostrar
export function formatearFecha(fecha: string | Date): string {
  let date: Date;
  
  if (typeof fecha === 'string') {
    // Si es string ISO, parsear sin desfase
    date = parsearFechaISO(fecha);
  } else {
    date = fecha;
  }
  
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Formatear fecha corta
export function formatearFechaCorta(fecha: string | Date): string {
  let date: Date;
  
  if (typeof fecha === 'string') {
    // Si es string ISO, parsear sin desfase
    date = parsearFechaISO(fecha);
  } else {
    date = fecha;
  }
  
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Obtener fecha en formato ISO (YYYY-MM-DD) - Local sin conversión a UTC
export function fechaISO(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const día = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${día}`;
}

// Parsear fecha ISO (YYYY-MM-DD) a Date local
export function parsearFechaISO(fechaStr: string): Date {
  const [año, mes, día] = fechaStr.split('-').map(Number);
  const fecha = new Date(año, mes - 1, día);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

// Obtener solo el día del mes de una fecha
export function obtenerDia(fecha: string | Date): number {
  let date: Date;
  
  if (typeof fecha === 'string') {
    date = parsearFechaISO(fecha);
  } else {
    date = fecha;
  }
  
  return date.getDate();
}

// Obtener mes y año (ej: ene 2026)
export function obtenerMesAno(fecha: string | Date): string {
  let date: Date;
  
  if (typeof fecha === 'string') {
    date = parsearFechaISO(fecha);
  } else {
    date = fecha;
  }
  
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

// Formatear timestamp ISO (con fecha y hora) para mostrar solo la fecha
export function formatearTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Formatear timestamp ISO (con fecha y hora) para mostrar solo la fecha corta
export function formatearTimestampCorto(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-ES');
}

// Verificar si es día de apertura
export function esDiaApertura(fecha: Date): boolean {
  const diaSemana = fecha.getDay();
  return DIAS_APERTURA.includes(diaSemana);
}

// Obtener nombre del día
export function getNombreDia(fecha: Date): string {
  return DIAS_SEMANA[fecha.getDay()];
}

// Obtener días disponibles para reservar
export function getDiasDisponibles(anticipacionMaximaDias: number): Date[] {
  const dias: Date[] = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (let i = 0; i <= anticipacionMaximaDias; i++) {
    const dia = new Date(hoy);
    dia.setDate(dia.getDate() + i);
    
    if (esDiaApertura(dia)) {
      dias.push(dia);
    }
  }

  return dias;
}

// Obtener nombre del turno
export function getNombreTurno(turno: Turno): string {
  return turno === 'ALMUERZO' ? 'Almuerzo' : 'Cena';
}

// Obtener nombre de la zona
export function getNombreZona(zona: Zona): string {
  const nombres: Record<Zona, string> = {
    FRENTE: 'Frente',
    GALERIA: 'Galería',
    SALON: 'Salón'
  };
  return nombres[zona];
}

// Obtener estado de reserva formateado
export function getEstadoReserva(estado: EstadoReserva): { texto: string; color: string } {
  const estados: Record<EstadoReserva, { texto: string; color: string }> = {
    RESERVADA: { texto: 'Reservada', color: 'success' },
    CANCELADA_POR_CLIENTE: { texto: 'Cancelada por cliente', color: 'warning' },
    CANCELADA_POR_RESTAURANTE: { texto: 'Cancelada por restaurante', color: 'error' }
  };
  return estados[estado];
}

// Obtener clase de color para porcentaje de ocupación
export function getColorOcupacion(porcentaje: number): string {
  if (porcentaje < 50) return 'bajo';
  if (porcentaje < 80) return 'medio';
  return 'alto';
}

// Capitalizar primera letra
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// Validar email
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validar teléfono (simple)
export function validarTelefono(telefono: string): boolean {
  const regex = /^[\d\s\-+()]{6,20}$/;
  return regex.test(telefono);
}

// Truncar texto
export function truncarTexto(texto: string, maxLength: number): string {
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength) + '...';
}

// Capacidades máximas por zona (personas)
export const CAPACIDADES_ZONA = {
  FRENTE: 30,
  GALERIA: 200,
  SALON: 500
} as const;

// Validar capacidad disponible en una zona
// Recibe directamente los disponibles ya calculados desde la UI (no recalcula)
// Retorna { valido: boolean, disponibles: number, mensaje?: string }
export function validarCapacidadZona(
  personasSolicitadas: number,
  disponiblesEnZona: number,
  zona: Zona
): { valido: boolean; disponibles: number; mensaje?: string } {
  if (personasSolicitadas > disponiblesEnZona) {
    return {
      valido: false,
      disponibles: disponiblesEnZona,
      mensaje: `No hay capacidad suficiente en ${getNombreZona(zona)} para esa cantidad de personas. Lugares disponibles: ${disponiblesEnZona}.`
    };
  }

  return {
    valido: true,
    disponibles: disponiblesEnZona
  };
}
