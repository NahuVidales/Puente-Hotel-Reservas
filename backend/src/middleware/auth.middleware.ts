import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'restaurante-puente-secret-key';

export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    rol: string;
    nombre: string;
    apellido: string;
  };
}

// Middleware para verificar JWT
export const verificarToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, rol: true, nombre: true, apellido: true }
    });

    if (!usuario) {
      res.status(401).json({ error: 'Usuario no encontrado.' });
      return;
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

// Middleware para verificar rol de responsable
export const verificarResponsable = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.usuario?.rol !== 'RESPONSABLE') {
    res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol de responsable.' 
    });
    return;
  }
  next();
};

// Middleware para verificar rol de cliente
export const verificarCliente = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.usuario?.rol !== 'CLIENTE') {
    res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol de cliente.' 
    });
    return;
  }
  next();
};
