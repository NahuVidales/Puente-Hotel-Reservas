import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuario administrador
  const passwordHashAdmin = await bcrypt.hash('ivo', 10);
  
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
  const passwordHashEmpleado = await bcrypt.hash('empleado', 10);
  
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

  // ===== DATOS DEL RESTAURANTE =====
  console.log('\n🍽️  Creando datos del restaurante...');

  // Crear mesas
  const mesas = [];
  const zonas: ('FRENTE' | 'GALERIA' | 'SALON')[] = ['FRENTE', 'GALERIA', 'SALON'];
  const capacidadesPorZona = {
    FRENTE: [2, 2, 4, 4],
    GALERIA: [4, 4, 6, 6, 8],
    SALON: [6, 8, 8, 10, 12]
  };

  let numeroMesa = 1;
  for (const zona of zonas) {
    for (const capacidad of capacidadesPorZona[zona]) {
      const mesa = await prisma.mesa.create({
        data: {
          numero: numeroMesa++,
          capacidad,
          zona,
          activa: true
        }
      });
      mesas.push(mesa);
    }
  }
  console.log(`✅ Creadas ${mesas.length} mesas`);

  // Crear mozos
  const mozos = [];
  const nombresMozos = [
    { nombre: 'Juan', apellido: 'Pérez', dni: '12345678' },
    { nombre: 'María', apellido: 'González', dni: '23456789' },
    { nombre: 'Carlos', apellido: 'Rodríguez', dni: '34567890' },
    { nombre: 'Ana', apellido: 'Martínez', dni: '45678901' },
    { nombre: 'Luis', apellido: 'López', dni: '56789012' }
  ];

  for (const { nombre, apellido, dni } of nombresMozos) {
    const mozo = await prisma.mozo.create({
      data: {
        nombre,
        apellido,
        dni,
        telefono: `011-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        activo: true
      }
    });
    mozos.push(mozo);
  }
  console.log(`✅ Creados ${mozos.length} mozos`);

  // Crear categorías de productos
  const categorias = [];
  const nombresCategorias = [
    'Entradas',
    'Platos Principales',
    'Pastas',
    'Pizzas',
    'Ensaladas',
    'Postres',
    'Bebidas',
    'Cafetería'
  ];

  for (const nombre of nombresCategorias) {
    const categoria = await prisma.categoriaProducto.create({
      data: { nombre }
    });
    categorias.push(categoria);
  }
  console.log(`✅ Creadas ${categorias.length} categorías`);

  // Crear productos
  const productos = [];
  const productosData = [
    // Entradas
    { nombre: 'Empanadas (x3)', categoriaId: categorias[0].id, precio: 3500, descripcion: 'Carne, pollo o jamón y queso' },
    { nombre: 'Tabla de fiambres', categoriaId: categorias[0].id, precio: 8500, descripcion: 'Quesos y embutidos variados' },
    { nombre: 'Provoleta', categoriaId: categorias[0].id, precio: 4200, descripcion: 'Con orégano y aceite de oliva' },
    { nombre: 'Papas fritas', categoriaId: categorias[0].id, precio: 3000, descripcion: 'Con cheddar y panceta opcional' },
    
    // Platos Principales
    { nombre: 'Bife de chorizo', categoriaId: categorias[1].id, precio: 12500, descripcion: '300g con guarnición' },
    { nombre: 'Milanesa napolitana', categoriaId: categorias[1].id, precio: 9800, descripcion: 'Con papas fritas' },
    { nombre: 'Suprema de pollo', categoriaId: categorias[1].id, precio: 8200, descripcion: 'Grillada con ensalada' },
    { nombre: 'Parrillada completa', categoriaId: categorias[1].id, precio: 15000, descripcion: 'Para 2 personas' },
    { nombre: 'Costillas BBQ', categoriaId: categorias[1].id, precio: 11000, descripcion: 'Con salsa barbacoa casera' },
    
    // Pastas
    { nombre: 'Ravioles', categoriaId: categorias[2].id, precio: 7500, descripcion: 'Ricota y espinaca con salsa a elección' },
    { nombre: 'Sorrentinos', categoriaId: categorias[2].id, precio: 8000, descripcion: 'Jamón y mozzarella' },
    { nombre: 'Ñoquis', categoriaId: categorias[2].id, precio: 6800, descripcion: 'Con salsa bolognesa o fileto' },
    { nombre: 'Tallarines', categoriaId: categorias[2].id, precio: 6500, descripcion: 'Con salsa a elección' },
    
    // Pizzas
    { nombre: 'Pizza Muzzarella', categoriaId: categorias[3].id, precio: 6500, descripcion: 'Grande, 8 porciones' },
    { nombre: 'Pizza Napolitana', categoriaId: categorias[3].id, precio: 7200, descripcion: 'Tomate, ajo y albahaca' },
    { nombre: 'Pizza Especial', categoriaId: categorias[3].id, precio: 8500, descripcion: 'Jamón, morrón, huevo' },
    { nombre: 'Pizza Calabresa', categoriaId: categorias[3].id, precio: 7800, descripcion: 'Con longaniza y aceitunas' },
    
    // Ensaladas
    { nombre: 'Ensalada César', categoriaId: categorias[4].id, precio: 6200, descripcion: 'Lechuga, pollo, parmesano, crutones' },
    { nombre: 'Ensalada mixta', categoriaId: categorias[4].id, precio: 4500, descripcion: 'Lechuga, tomate, zanahoria, huevo' },
    
    // Postres
    { nombre: 'Flan casero', categoriaId: categorias[5].id, precio: 3200, descripcion: 'Con dulce de leche o crema' },
    { nombre: 'Tiramisu', categoriaId: categorias[5].id, precio: 4500, descripcion: 'Receta italiana tradicional' },
    { nombre: 'Panqueques', categoriaId: categorias[5].id, precio: 4000, descripcion: 'Con dulce de leche' },
    { nombre: 'Helado', categoriaId: categorias[5].id, precio: 3500, descripcion: '2 bochas a elección' },
    
    // Bebidas
    { nombre: 'Coca-Cola 1.5L', categoriaId: categorias[6].id, precio: 2500, descripcion: 'Regular o Zero' },
    { nombre: 'Agua mineral 1L', categoriaId: categorias[6].id, precio: 1500, descripcion: 'Con o sin gas' },
    { nombre: 'Cerveza Quilmes', categoriaId: categorias[6].id, precio: 2200, descripcion: '1L' },
    { nombre: 'Vino tinto', categoriaId: categorias[6].id, precio: 5500, descripcion: 'Botella 750ml' },
    { nombre: 'Jugo natural', categoriaId: categorias[6].id, precio: 2800, descripcion: 'Naranja o pomelo' },
    
    // Cafetería
    { nombre: 'Café expreso', categoriaId: categorias[7].id, precio: 1800, descripcion: 'Simple o doble' },
    { nombre: 'Cappuccino', categoriaId: categorias[7].id, precio: 2500, descripcion: 'Con espuma de leche' },
    { nombre: 'Té', categoriaId: categorias[7].id, precio: 1500, descripcion: 'Variedades' },
    { nombre: 'Café con leche', categoriaId: categorias[7].id, precio: 2200, descripcion: 'Con medialunas' }
  ];

  for (const prod of productosData) {
    const producto = await prisma.producto.create({
      data: prod
    });
    productos.push(producto);
  }
  console.log(`✅ Creados ${productos.length} productos`);

  // ===== CREAR CUENTAS CERRADAS DE LOS ÚLTIMOS 30 DÍAS =====
  console.log('\n📋 Generando cuentas cerradas de prueba...');

  const hoy = new Date();
  const cantidadCuentas = 80; // Bastantes cuentas de prueba
  
  for (let i = 0; i < cantidadCuentas; i++) {
    // Fecha aleatoria en los últimos 30 días
    const diasAtras = Math.floor(Math.random() * 30);
    const horaApertura = Math.floor(Math.random() * 12) + 11; // Entre 11:00 y 23:00
    const minutoApertura = Math.floor(Math.random() * 60);
    
    const fechaApertura = new Date(hoy);
    fechaApertura.setDate(hoy.getDate() - diasAtras);
    fechaApertura.setHours(horaApertura, minutoApertura, 0, 0);
    
    // Duración de la comida (30 min a 3 horas)
    const duracionMinutos = Math.floor(Math.random() * 150) + 30;
    const fechaCierre = new Date(fechaApertura);
    fechaCierre.setMinutes(fechaCierre.getMinutes() + duracionMinutos);
    
    // Mesa y mozo aleatorios
    const mesa = mesas[Math.floor(Math.random() * mesas.length)];
    const mozo = mozos[Math.floor(Math.random() * mozos.length)];
    
    // Número de clientes (1-12)
    const numeroClientes = Math.floor(Math.random() * 12) + 1;
    
    // Crear la cuenta
    const cuenta = await prisma.cuenta.create({
      data: {
        mesaId: mesa.id,
        mozoId: mozo.id,
        numeroClientes,
        fechaApertura,
        fechaCierre,
        estado: 'CERRADA',
        subtotal: 0, // Se calculará después
        propina: 0,
        total: 0
      }
    });
    
    // Crear items aleatorios (2-8 productos)
    const cantidadItems = Math.floor(Math.random() * 7) + 2;
    let subtotal = 0;
    
    for (let j = 0; j < cantidadItems; j++) {
      const producto = productos[Math.floor(Math.random() * productos.length)];
      const cantidad = Math.floor(Math.random() * 3) + 1; // 1-3 unidades
      const precioTotal = producto.precio * cantidad;
      subtotal += precioTotal;
      
      await prisma.itemPedido.create({
        data: {
          cuentaId: cuenta.id,
          productoId: producto.id,
          cantidad,
          precioUnitario: producto.precio,
          precioTotal,
          estado: 'ENTREGADO',
          fechaPedido: fechaApertura,
          fechaEntrega: new Date(fechaApertura.getTime() + Math.random() * 30 * 60000) // Entregado en 30 min
        }
      });
    }
    
    // Propina aleatoria (0%, 5%, 10%)
    const propinaOpciones = [0, subtotal * 0.05, subtotal * 0.10];
    const propina = propinaOpciones[Math.floor(Math.random() * propinaOpciones.length)];
    const total = subtotal + propina;
    
    // Actualizar totales de la cuenta
    await prisma.cuenta.update({
      where: { id: cuenta.id },
      data: {
        subtotal,
        propina,
        total
      }
    });
  }
  
  console.log(`✅ Creadas ${cantidadCuentas} cuentas cerradas de los últimos 30 días`);

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
