import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuario administrador
  const passwordHash = await bcrypt.hash('ivo', 10);
  
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      nombre: 'Administrador',
      apellido: 'Sistema',
      telefono: '000000000',
      email: 'admin',
      passwordHash: passwordHash,
      rol: 'RESPONSABLE',
    },
  });

  console.log('✅ Usuario administrador creado:', admin.email);

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
