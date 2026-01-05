// Tipos para Usuario
export type Rol = 'CLIENTE' | 'RESPONSABLE';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  rol: Rol;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

// Tipos para Reserva
export type Turno = 'ALMUERZO' | 'CENA';
export type Zona = 'FRENTE' | 'GALERIA' | 'SALON';
export type EstadoReserva = 'RESERVADA' | 'CANCELADA_POR_CLIENTE' | 'CANCELADA_POR_RESTAURANTE';

export interface Reserva {
  id: number;
  clienteId: number;
  fecha: string;
  turno: Turno;
  zona: Zona;
  cantidadPersonas: number;
  observaciones?: string | null;
  estado: EstadoReserva;
  fechaCreacion: string;
  fechaUltimaModificacion: string;
  cliente?: Usuario;
  comentarios?: ComentarioReserva[];
  puedeModificar?: boolean;
  puedeCancelar?: boolean;
  esFutura?: boolean;
}

// Tipos para Comentarios
export interface ComentarioReserva {
  id: number;
  reservaId: number;
  textoComentario: string;
  fechaComentario: string;
}

// Tipos para Parámetros
export interface ParametrosCapacidad {
  id: number;
  capacidadFrente: number;
  capacidadGaleria: number;
  capacidadSalon: number;
  capacidadTotal: number;
  anticipacionMaximaDias: number;
  diasApertura: string[];
  turnos: string[];
}

// Tipos para Disponibilidad
export interface DisponibilidadZona {
  reservadas: number;
  capacidad: number;
  disponibles: number;
}

export interface Disponibilidad {
  fecha: string;
  turno: Turno;
  capacidad: {
    total: number;
    frente: number;
    galeria: number;
    salon: number;
  };
  ocupacion: {
    personasReservadas: number;
    lugaresDisponibles: number;
    porcentajeOcupacion: number;
    porZona: {
      FRENTE: DisponibilidadZona;
      GALERIA: DisponibilidadZona;
      SALON: DisponibilidadZona;
    };
  };
  cantidadReservas: number;
}

// Tipos para Planificación
export interface ResumenPlanificacion {
  capacidadTotal: number;
  totalPersonas: number;
  porcentajeOcupacion: number;
  totalReservas: number;
  conObservaciones: number;
}

export interface GrupoPorZonaTamano {
  zona: Zona;
  tamano: string;
  reservas: number;
  personas: number;
  conObservaciones: number;
}

export interface Planificacion {
  fecha: string;
  turno: string;
  resumen: ResumenPlanificacion;
  porZona: Record<Zona, { reservas: number; personas: number; conObservaciones: number }>;
  porTamano: Record<string, { reservas: number; personas: number; conObservaciones: number }>;
  porZonaYTamano: GrupoPorZonaTamano[];
  capacidadPorZona: Record<Zona, number>;
}

// Tipos para formularios
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegistroForm {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
  confirmarPassword: string;
}

export interface ReservaForm {
  fecha: string;
  turno: Turno;
  zona: Zona;
  cantidadPersonas: number;
  observaciones?: string;
  clienteId?: number;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  mensaje?: string;
  error?: string;
  [key: string]: T | string | undefined;
}

export interface AuthResponse {
  mensaje: string;
  usuario: Usuario;
  token: string;
}

// Constantes
export const TURNOS: { value: Turno; label: string }[] = [
  { value: 'ALMUERZO', label: 'Almuerzo' },
  { value: 'CENA', label: 'Cena' }
];

export const ZONAS: { value: Zona; label: string }[] = [
  { value: 'FRENTE', label: 'Frente' },
  { value: 'GALERIA', label: 'Galería' },
  { value: 'SALON', label: 'Salón' }
];

export const ESTADOS_RESERVA: { value: EstadoReserva; label: string; color: string }[] = [
  { value: 'RESERVADA', label: 'Reservada', color: 'success' },
  { value: 'CANCELADA_POR_CLIENTE', label: 'Cancelada por cliente', color: 'warning' },
  { value: 'CANCELADA_POR_RESTAURANTE', label: 'Cancelada por restaurante', color: 'error' }
];

export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Días de apertura (2=Martes a 6=Sábado)
export const DIAS_APERTURA = [2, 3, 4, 5, 6];
