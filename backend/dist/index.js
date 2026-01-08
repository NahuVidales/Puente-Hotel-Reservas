"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const client_1 = require("@prisma/client");
// Importar rutas
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const reserva_routes_1 = __importDefault(require("./routes/reserva.routes"));
const usuario_routes_1 = __importDefault(require("./routes/usuario.routes"));
const parametros_routes_1 = __importDefault(require("./routes/parametros.routes"));
const comentario_routes_1 = __importDefault(require("./routes/comentario.routes"));
const empleados_routes_1 = __importDefault(require("./routes/empleados.routes"));
// Inicializar Prisma
exports.prisma = new client_1.PrismaClient();
// Crear aplicación Express
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middlewares
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173', // URL del frontend Vite
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Rutas de la API
app.use('/api/auth', auth_routes_1.default);
app.use('/api/reservas', reserva_routes_1.default);
app.use('/api/usuarios', usuario_routes_1.default);
app.use('/api/parametros', parametros_routes_1.default);
app.use('/api/comentarios', comentario_routes_1.default);
app.use('/api/empleados', empleados_routes_1.default);
// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mensaje: 'API del restaurante funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});
// Manejo de errores global
app.use((err, req, res, next) => {
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
    await exports.prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=index.js.map