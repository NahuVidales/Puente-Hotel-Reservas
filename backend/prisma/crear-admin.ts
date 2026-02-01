import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Creando usuario administrador...')

  // Limpiar solo usuarios
  await prisma.usuario.deleteMany({
    where: {
      email: 'admin'
    }
  })

  // Crear usuario administrador con credenciales simples
  const passwordHashAdmin = await bcrypt.hash('admin', 10)
  
  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Administrador',
      apellido: 'Sistema',
      telefono: '000000000',
      email: 'admin',
      passwordHash: passwordHashAdmin,
      rol: 'RESPONSABLE',
    }
  })

  console.log('✅ Usuario administrador creado exitosamente!')
  console.log('📧 Email/Usuario: admin')
  console.log('🔑 Contraseña: admin')
  console.log('\n🎉 ¡Ahora puedes iniciar sesión en la aplicación!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })