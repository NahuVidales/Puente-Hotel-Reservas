import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';

// Importar rutas
import authRoutes from './routes/auth.routes';
import reservaRoutes from './routes/reserva.routes';
import usuarioRoutes from './routes/usuario.routes';
import parametrosRoutes from './routes/parametros.routes';
import comentarioRoutes from './routes/comentario.routes';
import empleadosRoutes from './routes/empleados.routes';
// Rutas del módulo restaurante
import productosRoutes from './routes/productos.routes';
import mesasRoutes from './routes/mesas.routes';
import mozosRoutes from './routes/mozos.routes';
import cuentasRoutes from './routes/cuentas.routes';

// Inicializar Prisma
export const prisma = new PrismaClient();

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // URL del frontend Vite
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/parametros', parametrosRoutes);
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/empleados', empleadosRoutes);

// Rutas del módulo restaurante
app.use('/api/productos', productosRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/mozos', mozosRoutes);
app.use('/api/cuentas', cuentasRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mensaje: 'API del restaurante funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    mensaje: err.message || 'Ha ocurrido un error inesperado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🍽️  Servidor del restaurante corriendo en http://localhost:${PORT}`);
  console.log(`📋 API disponible en http://localhost:${PORT}/api`);
});

// Cerrar conexión Prisma al terminar
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
