"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Obtener todos los clientes (solo responsables)
router.get('/', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const usuarios = await index_1.prisma.usuario.findMany({
            where: { rol: 'CLIENTE' },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                fechaCreacion: true,
                _count: {
                    select: { reservas: true }
                }
            },
            orderBy: { nombre: 'asc' }
        });
        res.json({ usuarios });
    }
    catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
});
// Buscar clientes por nombre o email (solo responsables)
router.get('/buscar', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Se requiere un término de búsqueda de al menos 2 caracteres.' });
        }
        const usuarios = await index_1.prisma.usuario.findMany({
            where: {
                rol: 'CLIENTE',
                OR: [
                    { nombre: { contains: q } },
                    { apellido: { contains: q } },
                    { email: { contains: q } }
                ]
            },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true
            },
            take: 10
        });
        res.json({ usuarios });
    }
    catch (error) {
        console.error('Error al buscar usuarios:', error);
        res.status(500).json({ error: 'Error al buscar usuarios.' });
    }
});
// Obtener un usuario específico (solo responsables)
router.get('/:id', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await index_1.prisma.usuario.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                rol: true,
                fechaCreacion: true,
                reservas: {
                    orderBy: { fecha: 'desc' },
                    take: 10,
                    include: {
                        comentarios: true
                    }
                }
            }
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json({ usuario });
    }
    catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener usuario.' });
    }
});
exports.default = router;
//# sourceMappingURL=usuario.routes.js.map