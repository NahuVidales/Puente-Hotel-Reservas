import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    usuario?: {
        id: number;
        email: string;
        rol: string;
        nombre: string;
        apellido: string;
    };
}
export declare const verificarToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const verificarResponsable: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const verificarCliente: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map