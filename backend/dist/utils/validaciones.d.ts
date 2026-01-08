export declare const DIAS_APERTURA: number[];
export declare const CAPACIDADES_ZONA: {
    readonly FRENTE: 30;
    readonly GALERIA: 200;
    readonly SALON: 500;
};
export declare const NOMBRES_DIAS: {
    [key: number]: string;
};
export declare function parsearFechaISO(fechaStr: string): Date;
export declare function esDiaApertura(fecha: Date): boolean;
export declare function estaEnRangoAnticipacion(fecha: Date, anticipacionMaximaDias: number): boolean;
export declare function faltanMasDe24Horas(fecha: Date, turno: string): boolean;
export declare function esReservaFutura(fecha: Date): boolean;
export declare function esReservaPasada(fecha: Date): boolean;
export declare function formatearFecha(fecha: Date): string;
export declare function getNombreTurno(turno: string): string;
export declare function getNombreZona(zona: string): string;
export declare function validarCantidadPersonas(cantidad: number): {
    valido: boolean;
    mensaje?: string;
};
export declare function getRangoTamanoGrupo(cantidad: number): string;
export declare function serializarFechaISO(fecha: Date | string): string;
export declare function validarCapacidadZona(personasSolicitadas: number, personasYaReservadas: number, zona: string): {
    valido: boolean;
    disponibles: number;
    mensaje?: string;
};
//# sourceMappingURL=validaciones.d.ts.map