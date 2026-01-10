"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'restaurante-puente-secret-key';
// Registro de nuevo cliente
router.post('/registro', async (req, res) => {
    try {
        const { nombre, apellido, telefono, email, password } = req.body;
        console.log('[POST /auth/registro] Registrando nuevo usuario:', { nombre, apellido, email });
        // Validaciones básicas
        if (!nombre || !apellido || !telefono || !email || !password) {
            console.log('[POST /auth/registro] Falta campos obligatorios');
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
            console.log('[POST /auth/registro] Email ya existe:', email);
            return res.status(400).json({
                error: 'Ya existe una cuenta con este email.'
            });
        }
        // Hashear contraseña
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Crear usuario
        const nuevoUsuario = await index_1.prisma.usuario.create({
            data: {
                nombre,
                apellido,
                telefono,
                email,
                passwordHash,
                rol: 'CLIENTE' // Los registros siempre son clientes
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
        console.log('[POST /auth/registro] Usuario creado:', nuevoUsuario.id);
        // Generar token
        const token = jsonwebtoken_1.default.sign({ id: nuevoUsuario.id, email: nuevoUsuario.email, rol: nuevoUsuario.rol }, JWT_SECRET, { expiresIn: '24h' });
        // Establecer cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });
        res.status(201).json({
            mensaje: '¡Registro exitoso! Bienvenido al restaurante.',
            usuario: nuevoUsuario,
            token
        });
    }
    catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario.' });
    }
});
// Inicio de sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email y contraseña son obligatorios.'
            });
        }
        // Buscar usuario
        const usuario = await index_1.prisma.usuario.findUnique({
            where: { email }
        });
        if (!usuario) {
            return res.status(401).json({
                error: 'Credenciales incorrectas.'
            });
        }
        // Verificar contraseña
        const passwordValido = await bcryptjs_1.default.compare(password, usuario.passwordHash);
        if (!passwordValido) {
            return res.status(401).json({
                error: 'Credenciales incorrectas.'
            });
        }
        // Generar token
        const token = jsonwebtoken_1.default.sign({ id: usuario.id, email: usuario.email, rol: usuario.rol }, JWT_SECRET, { expiresIn: '24h' });
        // Establecer cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({
            mensaje: '¡Inicio de sesión exitoso!',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                telefono: usuario.telefono,
                rol: usuario.rol
            },
            token
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
});
// Cerrar sesión
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ mensaje: 'Sesión cerrada correctamente.' });
});
// Obtener usuario actual
router.get('/me', auth_middleware_1.verificarToken, async (req, res) => {
    try {
        const usuario = await index_1.prisma.usuario.findUnique({
            where: { id: req.usuario?.id },
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
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json({ usuario });
    }
    catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener información del usuario.' });
    }
});
// Actualizar perfil
router.put('/perfil', auth_middleware_1.verificarToken, async (req, res) => {
    try {
        const { nombre, apellido, telefono, email } = req.body;
        const userId = req.usuario?.id;
        // Validaciones básicas
        if (!nombre || !apellido || !telefono || !email) {
            return res.status(400).json({
                error: 'Nombre, apellido, teléfono y email son obligatorios.'
            });
        }
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'El email debe ser válido (ejemplo: usuario@dominio.com)'
            });
        }
        // Verificar que el email sea único (si cambió)
        const usuarioActual = await index_1.prisma.usuario.findUnique({
            where: { id: userId }
        });
        if (usuarioActual?.email !== email) {
            const emailExistente = await index_1.prisma.usuario.findUnique({
                where: { email }
            });
            if (emailExistente) {
                return res.status(400).json({
                    error: 'El email ya existe. Elegí otro email.'
                });
            }
        }
        const usuarioActualizado = await index_1.prisma.usuario.update({
            where: { id: userId },
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
                rol: true
            }
        });
        res.json({
            mensaje: 'Perfil actualizado correctamente.',
            usuario: usuarioActualizado
        });
    }
    catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil.' });
    }
});
// Cambiar contraseña
router.put('/perfil/password', auth_middleware_1.verificarToken, async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        const userId = req.usuario?.id;
        // Validaciones básicas
        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                error: 'Contraseña actual y nueva son obligatorias.'
            });
        }
        if (passwordNueva.length < 4) {
            return res.status(400).json({
                error: 'La contraseña nueva debe tener al menos 4 caracteres.'
            });
        }
        // Obtener usuario actual
        const usuario = await index_1.prisma.usuario.findUnique({
            where: { id: userId }
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        // Verificar que la contraseña actual sea correcta
        const passwordValido = await bcryptjs_1.default.compare(passwordActual, usuario.passwordHash);
        if (!passwordValido) {
            return res.status(400).json({
                error: 'Contraseña actual incorrecta.'
            });
        }
        // Hashear la nueva contraseña
        const passwordHash = await bcryptjs_1.default.hash(passwordNueva, 10);
        // Actualizar contraseña
        await index_1.prisma.usuario.update({
            where: { id: userId },
            data: { passwordHash }
        });
        res.json({
            mensaje: 'Contraseña actualizada correctamente.'
        });
    }
    catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: 'Error al cambiar contraseña.' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map