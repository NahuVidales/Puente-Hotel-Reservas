"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');
    // Crear usuario administrador
    const passwordHashAdmin = await bcryptjs_1.default.hash('ivo', 10);
    const admin = await prisma.usuario.upsert({
        where: { email: 'admin' },
        update: {},
        create: {
            nombre: 'Administrador',
            apellido: 'Sistema',
            telefono: '000000000',
            email: 'admin',
            passwordHash: passwordHashAdmin,
            rol: 'RESPONSABLE',
        },
    });
    console.log('✅ Usuario administrador creado:', admin.email);
    // Crear usuario empleado
    const passwordHashEmpleado = await bcryptjs_1.default.hash('empleado', 10);
    const empleado = await prisma.usuario.upsert({
        where: { email: 'empleado' },
        update: {},
        create: {
            nombre: 'Empleado',
            apellido: 'Sistema',
            telefono: '000000001',
            email: 'empleado',
            passwordHash: passwordHashEmpleado,
            rol: 'RESPONSABLE',
        },
    });
    console.log('✅ Usuario empleado creado:', empleado.email);
    // Crear parámetros de capacidad iniciales
    const parametros = await prisma.parametrosCapacidadRestaurante.upsert({
        where: { id: 1 },
        update: {},
        create: {
            capacidadFrente: 30,
            capacidadGaleria: 200,
            capacidadSalon: 500,
            anticipacionMaximaDias: 30,
        },
    });
    console.log('✅ Parámetros de capacidad creados:');
    console.log(`   - Capacidad Frente: ${parametros.capacidadFrente}`);
    console.log(`   - Capacidad Galería: ${parametros.capacidadGaleria}`);
    console.log(`   - Capacidad Salón: ${parametros.capacidadSalon}`);
    console.log(`   - Capacidad Total: ${parametros.capacidadFrente + parametros.capacidadGaleria + parametros.capacidadSalon}`);
    console.log(`   - Anticipación máxima: ${parametros.anticipacionMaximaDias} días`);
    console.log('🎉 Seed completado exitosamente!');
}
main()
    .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map