import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    console.log('🔐 Reseteando contraseñas...\n');
    
    // Hashear la nueva contraseña "admin"
    const newPassword = 'admin';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`Nueva contraseña: "${newPassword}"`);
    console.log(`Hash generado: ${hashedPassword}\n`);
    
    // Obtener todos los usuarios
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, apellido: true, email: true, rol: true }
    });
    
    console.log(`📋 Usuarios encontrados: ${usuarios.length}\n`);
    
    // Actualizar todos los usuarios con la nueva contraseña
    for (const usuario of usuarios) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { passwordHash: hashedPassword }
      });
      
      console.log(`✅ ${usuario.nombre} ${usuario.apellido} (${usuario.email}) - Contraseña actualizada`);
    }
    
    console.log(`\n🎉 ¡${usuarios.length} contraseñas actualizadas exitosamente!`);
    console.log(`\n📝 Credenciales de acceso:\n`);
    
    usuarios.forEach(usuario => {
      console.log(`Email: ${usuario.email}`);
      console.log(`Contraseña: ${newPassword}`);
      console.log(`Rol: ${usuario.rol}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error reseteando contraseñas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords();
