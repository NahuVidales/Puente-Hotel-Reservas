"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("../index");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Obtener todos los usuarios del sistema (solo responsables)
router.get('/', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        console.log('[GET /empleados] Obteniendo lista de usuarios');
        const empleados = await index_1.prisma.usuario.findMany({
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                rol: true,
                fechaCreacion: true
            },
            orderBy: {
                fechaCreacion: 'desc'
            }
        });
        console.log('[GET /empleados] Usuarios encontrados:', empleados.length);
        res.json({ empleados });
    }
    catch (error) {
        console.error('[GET /empleados] Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
});
// Crear nuevo empleado (solo responsables)
router.post('/', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const { nombre, apellido, telefono, email, password } = req.body;
        console.log('[POST /empleados] Creando nuevo empleado:', { nombre, apellido, email });
        // Validaciones básicas
        if (!nombre || !apellido || !telefono || !email || !password) {
            console.log('[POST /empleados] Falta campos obligatorios');
            return res.status(400).json({
                error: 'Todos los campos son obligatorios: nombre, apellido, teléfono, email y contraseña.'
            });
        }
        if (password.length < 4) {
            return res.status(400).json({
                error: 'La contraseña debe tener al menos 4 caracteres.'
            });
        }
        // Verificar si el email ya existe
        const usuarioExistente = await index_1.prisma.usuario.findUnique({
            where: { email }
        });
        if (usuarioExistente) {
            console.log('[POST /empleados] Email ya existe:', email);
            return res.status(400).json({
                error: 'Ya existe una cuenta con este email.'
            });
        }
        // Hashear contraseña
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Crear cliente
        const nuevoEmpleado = await index_1.prisma.usuario.create({
            data: {
                nombre,
                apellido,
                telefono,
                email,
                passwordHash,
                rol: 'CLIENTE' // Los clientes creados desde admin tienen rol CLIENTE
            },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                rol: true,
                fechaCreacion: true
            }
        });
        console.log('[POST /empleados] Empleado creado:', nuevoEmpleado.id);
        res.status(201).json({
            mensaje: '¡Cliente creado exitosamente!',
            empleado: nuevoEmpleado
        });
    }
    catch (error) {
        console.error('[POST /empleados] Error al crear empleado:', error);
        res.status(500).json({ error: 'Error al crear el empleado.', detalles: error.message });
    }
});
// Obtener un empleado específico (solo responsables)
router.get('/:id', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('[GET /empleados/:id] Obteniendo empleado:', id);
        const empleado = await index_1.prisma.usuario.findFirst({
            where: {
                id: parseInt(id),
                rol: 'RESPONSABLE'
            },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                rol: true,
                fechaCreacion: true
            }
        });
        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado.' });
        }
        res.json({ empleado });
    }
    catch (error) {
        console.error('[GET /empleados/:id] Error:', error);
        res.status(500).json({ error: 'Error al obtener empleado.' });
    }
});
// Actualizar empleado (solo responsables)
router.put('/:id', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, telefono, email } = req.body;
        console.log('[PUT /empleados/:id] Actualizando usuario:', id);
        // Validaciones básicas
        if (!nombre || !apellido || !telefono || !email) {
            return res.status(400).json({
                error: 'Todos los campos son obligatorios: nombre, apellido, teléfono, email.'
            });
        }
        // Verificar si el usuario existe (CLIENTE o RESPONSABLE)
        const usuarioExistente = await index_1.prisma.usuario.findUnique({
            where: { id: parseInt(id) }
        });
        if (!usuarioExistente) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        // Solo permitir editar usuarios con rol CLIENTE (para la gestión de clientes)
        if (usuarioExistente.rol !== 'CLIENTE') {
            return res.status(403).json({ error: 'Solo se pueden editar usuarios con rol CLIENTE.' });
        }
        // Si cambia el email, verificar que no esté en uso
        if (email !== usuarioExistente.email) {
            const emailEnUso = await index_1.prisma.usuario.findUnique({
                where: { email }
            });
            if (emailEnUso) {
                return res.status(400).json({
                    error: 'Ya existe una cuenta con este email.'
                });
            }
        }
        // Actualizar usuario
        const usuarioActualizado = await index_1.prisma.usuario.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                apellido,
                telefono,
                email
            },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                rol: true,
                fechaCreacion: true
            }
        });
        console.log('[PUT /empleados/:id] Usuario actualizado:', usuarioActualizado.id);
        res.json({
            mensaje: 'Usuario actualizado correctamente.',
            empleado: usuarioActualizado
        });
    }
    catch (error) {
        console.error('[PUT /empleados/:id] Error:', error);
        res.status(500).json({ error: 'Error al actualizar usuario.' });
    }
});
// Eliminar usuario (solo responsables)
router.delete('/:id', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('[DELETE /empleados/:id] Eliminando usuario:', id);
        // Verificar si el usuario existe
        const usuarioExistente = await index_1.prisma.usuario.findUnique({
            where: { id: parseInt(id) }
        });
        if (!usuarioExistente) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        // No permitir eliminar al usuario administrador (si el rol es RESPONSABLE y es el único o algo similar)
        // Por ahora, permitimos eliminar cualquier usuario excepto nosotros mismos
        if (usuarioExistente.id === req.usuario?.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
        }
        // Eliminar todas las reservas del usuario primero (por integridad referencial)
        await index_1.prisma.reserva.deleteMany({
            where: { clienteId: parseInt(id) }
        });
        // Eliminar el usuario
        const usuarioEliminado = await index_1.prisma.usuario.delete({
            where: { id: parseInt(id) },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true
            }
        });
        console.log('[DELETE /empleados/:id] Usuario eliminado:', usuarioEliminado.id);
        res.json({
            mensaje: 'Usuario eliminado correctamente.',
            usuario: usuarioEliminado
        });
    }
    catch (error) {
        console.error('[DELETE /empleados/:id] Error:', error);
        res.status(500).json({ error: 'Error al eliminar usuario.' });
    }
});
exports.default = router;
//# sourceMappingURL=empleados.routes.js.map