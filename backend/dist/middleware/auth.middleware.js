"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarCliente = exports.verificarResponsable = exports.verificarToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const JWT_SECRET = process.env.JWT_SECRET || 'restaurante-puente-secret-key';
// Middleware para verificar JWT
const verificarToken = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const usuario = await index_1.prisma.usuario.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, rol: true, nombre: true, apellido: true }
        });
        if (!usuario) {
            res.status(401).json({ error: 'Usuario no encontrado.' });
            return;
        }
        req.usuario = usuario;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};
exports.verificarToken = verificarToken;
// Middleware para verificar rol de responsable
const verificarResponsable = (req, res, next) => {
    if (req.usuario?.rol !== 'RESPONSABLE') {
        res.status(403).json({
            error: 'Acceso denegado. Se requiere rol de responsable.'
        });
        return;
    }
    next();
};
exports.verificarResponsable = verificarResponsable;
// Middleware para verificar rol de cliente
const verificarCliente = (req, res, next) => {
    if (req.usuario?.rol !== 'CLIENTE') {
        res.status(403).json({
            error: 'Acceso denegado. Se requiere rol de cliente.'
        });
        return;
    }
    next();
};
exports.verificarCliente = verificarCliente;
//# sourceMappingURL=auth.middleware.js.map