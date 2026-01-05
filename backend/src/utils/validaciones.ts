// Días de apertura del restaurante (0 = Domingo, 1 = Lunes, etc.)
// Martes (2) a Sábado (6)
export const DIAS_APERTURA = [2, 3, 4, 5, 6];

export const NOMBRES_DIAS: { [key: number]: string } = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado'
};

// Verificar si es un día de apertura válido
export function esDiaApertura(fecha: Date): boolean {
  const diaSemana = fecha.getDay();
  return DIAS_APERTURA.includes(diaSemana);
}

// Verificar si la fecha está dentro del rango de anticipación
export function estaEnRangoAnticipacion(fecha: Date, anticipacionMaximaDias: number): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaReserva = new Date(fecha);
  fechaReserva.setHours(0, 0, 0, 0);
  
  const fechaMaxima = new Date(hoy);
  fechaMaxima.setDate(fechaMaxima.getDate() + anticipacionMaximaDias);
  
  return fechaReserva >= hoy && fechaReserva <= fechaMaxima;
}

// Verificar si faltan más de 24 horas para el turno
export function faltanMasDe24Horas(fecha: Date, turno: Turno): boolean {
  const ahora = new Date();
  const fechaReserva = new Date(fecha);
  
  // Establecer hora aproximada del turno
  if (turno === Turno.ALMUERZO) {
    fechaReserva.setHours(12, 0, 0, 0); // Mediodía para almuerzo
  } else {
    fechaReserva.setHours(20, 0, 0, 0); // 8 PM para cena
  }
  
  const diferenciaMs = fechaReserva.getTime() - ahora.getTime();
  const horasRestantes = diferenciaMs / (1000 * 60 * 60);
  
  return horasRestantes > 24;
}

// Verificar si es una reserva futura
export function esReservaFutura(fecha: Date): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaReserva = new Date(fecha);
  fechaReserva.setHours(0, 0, 0, 0);
  
  return fechaReserva >= hoy;
}

// Verificar si es una reserva pasada
export function esReservaPasada(fecha: Date): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaReserva = new Date(fecha);
  fechaReserva.setHours(0, 0, 0, 0);
  
  return fechaReserva < hoy;
}

// Formatear fecha para mostrar
export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Obtener nombre del turno
export function getNombreTurno(turno: Turno): string {
  return turno === Turno.ALMUERZO ? 'Almuerzo' : 'Cena';
}

// Obtener nombre de la zona
export function getNombreZona(zona: Zona): string {
  const nombres: { [key: string]: string } = {
    FRENTE: 'Frente',
    GALERIA: 'Galería',
    SALON: 'Salón'
  };
  return nombres[zona] || zona;
}

// Validar cantidad de personas
export function validarCantidadPersonas(cantidad: number): { valido: boolean; mensaje?: string } {
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
export function getRangoTamanoGrupo(cantidad: number): string {
  if (cantidad <= 2) return '1-2';
  if (cantidad <= 4) return '3-4';
  if (cantidad <= 6) return '5-6';
  return '7+';
}
