import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { verificarToken, AuthRequest } from '../middleware/auth.middleware';
import { Rol } from '@prisma/client';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'restaurante-puente-secret-key';

// Registro de nuevo cliente
router.post('/registro', async (req, res) => {
  try {
    const { nombre, apellido, telefono, email, password } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !telefono || !email || !password) {
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
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return res.status(400).json({ 
        error: 'Ya existe una cuenta con este email.' 
      });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        telefono,
        email,
        passwordHash,
        rol: Rol.CLIENTE // Los registros siempre son clientes
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

    // Generar token
    const token = jwt.sign(
      { id: nuevoUsuario.id, email: nuevoUsuario.email, rol: nuevoUsuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  } catch (error) {
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
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return res.status(401).json({ 
        error: 'Credenciales incorrectas.' 
      });
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValido) {
      return res.status(401).json({ 
        error: 'Credenciales incorrectas.' 
      });
    }

    // Generar token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  } catch (error) {
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
router.get('/me', verificarToken, async (req: AuthRequest, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
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
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener información del usuario.' });
  }
});

// Actualizar perfil
router.put('/perfil', verificarToken, async (req: AuthRequest, res) => {
  try {
    const { nombre, apellido, telefono } = req.body;

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: req.usuario?.id },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(telefono && { telefono })
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
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
});

export default router;
