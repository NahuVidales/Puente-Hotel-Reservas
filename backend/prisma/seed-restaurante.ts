import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRestaurante() {
  try {
    console.log('🍽️  Poblando datos del restaurante...\n');

    // 1. Crear categorías de productos
    console.log('📋 Creando categorías de productos...');
    const categorias = await Promise.all([
      prisma.categoriaProducto.upsert({
        where: { nombre: 'Entradas' },
        update: {},
        create: { nombre: 'Entradas' }
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: 'Platos Principales' },
        update: {},
        create: { nombre: 'Platos Principales' }
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: 'Pastas' },
        update: {},
        create: { nombre: 'Pastas' }
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: 'Carnes' },
        update: {},
        create: { nombre: 'Carnes' }
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: 'Pescados' },
        update: {},
        create: { nombre: 'Pescados' }
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: 'Postres' },
        update: {},
        create: { nombre: 'Postres' }
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: 'Bebidas' },
        update: {},
        create: { nombre: 'Bebidas' }
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: 'Vinos' },
        update: {},
        create: { nombre: 'Vinos' }
      })
    ]);
    console.log(`✅ ${categorias.length} categorías creadas\n`);

    // 2. Crear productos del menú
    console.log('🍕 Creando productos del menú...');
    const productos = await Promise.all([
      // Entradas
      prisma.producto.create({
        data: {
          nombre: 'Provoleta',
          descripcion: 'Queso provolone gratinado al horno con orégano',
          precio: 3500,
          categoriaId: categorias[0].id,
          tiempoPreparacion: 15
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Empanadas de Carne',
          descripcion: 'Tradicionales empanadas criollas (3 unidades)',
          precio: 2800,
          categoriaId: categorias[0].id,
          tiempoPreparacion: 10
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Tabla de Fiambres',
          descripcion: 'Selección de fiambres y quesos artesanales',
          precio: 5500,
          categoriaId: categorias[0].id,
          tiempoPreparacion: 10
        }
      }),

      // Pastas
      prisma.producto.create({
        data: {
          nombre: 'Ravioles de Ricota',
          descripcion: 'Ravioles caseros con salsa a elección',
          precio: 4200,
          categoriaId: categorias[2].id,
          tiempoPreparacion: 20
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Sorrentinos de Jamón y Queso',
          descripcion: 'Pasta rellena con nuestra salsa especial',
          precio: 4500,
          categoriaId: categorias[2].id,
          tiempoPreparacion: 20
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Ñoquis de Papa',
          descripcion: 'Ñoquis caseros con salsa tuco o fileto',
          precio: 4000,
          categoriaId: categorias[2].id,
          tiempoPreparacion: 20
        }
      }),

      // Carnes
      prisma.producto.create({
        data: {
          nombre: 'Bife de Chorizo',
          descripcion: 'Corte premium 400g con guarnición',
          precio: 8500,
          categoriaId: categorias[3].id,
          tiempoPreparacion: 25
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Entraña',
          descripcion: 'Entraña angus 350g a la parrilla',
          precio: 7800,
          categoriaId: categorias[3].id,
          tiempoPreparacion: 25
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Milanesa Napolitana',
          descripcion: 'Milanesa de ternera con jamón, queso y salsa',
          precio: 6500,
          categoriaId: categorias[3].id,
          tiempoPreparacion: 20
        }
      }),

      // Pescados
      prisma.producto.create({
        data: {
          nombre: 'Salmón Grillado',
          descripcion: 'Filet de salmón con vegetales salteados',
          precio: 9200,
          categoriaId: categorias[4].id,
          tiempoPreparacion: 25
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Merluza a la Romana',
          descripcion: 'Merluza rebozada con papas fritas',
          precio: 5800,
          categoriaId: categorias[4].id,
          tiempoPreparacion: 20
        }
      }),

      // Postres
      prisma.producto.create({
        data: {
          nombre: 'Flan Casero',
          descripcion: 'Flan tradicional con dulce de leche y crema',
          precio: 2200,
          categoriaId: categorias[5].id,
          tiempoPreparacion: 5
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Tiramisu',
          descripcion: 'Postre italiano con café y mascarpone',
          precio: 2800,
          categoriaId: categorias[5].id,
          tiempoPreparacion: 5
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Helado Artesanal',
          descripcion: 'Tres bochas de helado con toppings',
          precio: 2500,
          categoriaId: categorias[5].id,
          tiempoPreparacion: 5
        }
      }),

      // Bebidas
      prisma.producto.create({
        data: {
          nombre: 'Agua Mineral',
          descripcion: 'Agua mineral sin gas 500ml',
          precio: 800,
          categoriaId: categorias[6].id,
          tiempoPreparacion: 2
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Coca Cola',
          descripcion: 'Coca Cola 500ml',
          precio: 1200,
          categoriaId: categorias[6].id,
          tiempoPreparacion: 2
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Cerveza Artesanal',
          descripcion: 'Cerveza artesanal tirada 500ml',
          precio: 2500,
          categoriaId: categorias[6].id,
          tiempoPreparacion: 5
        }
      }),

      // Vinos
      prisma.producto.create({
        data: {
          nombre: 'Malbec Reserva',
          descripcion: 'Vino tinto Malbec de Mendoza',
          precio: 4500,
          categoriaId: categorias[7].id,
          tiempoPreparacion: 5
        }
      }),
      prisma.producto.create({
        data: {
          nombre: 'Torrontés',
          descripcion: 'Vino blanco aromático',
          precio: 3800,
          categoriaId: categorias[7].id,
          tiempoPreparacion: 5
        }
      })
    ]);
    console.log(`✅ ${productos.length} productos creados\n`);

    // 3. Crear mozos
    console.log('👨‍🍳 Creando mozos...');
    const mozos = await Promise.all([
      prisma.mozo.upsert({
        where: { dni: '33456789' },
        update: {},
        create: {
          nombre: 'Carlos',
          apellido: 'Rodríguez',
          telefono: '3511234567',
          dni: '33456789'
        }
      }),
      prisma.mozo.upsert({
        where: { dni: '34567890' },
        update: {},
        create: {
          nombre: 'María',
          apellido: 'González',
          telefono: '3519876543',
          dni: '34567890'
        }
      }),
      prisma.mozo.upsert({
        where: { dni: '35678901' },
        update: {},
        create: {
          nombre: 'Juan',
          apellido: 'Pérez',
          telefono: '3512345678',
          dni: '35678901'
        }
      }),
      prisma.mozo.upsert({
        where: { dni: '36789012' },
        update: {},
        create: {
          nombre: 'Ana',
          apellido: 'Martínez',
          telefono: '3518765432',
          dni: '36789012'
        }
      }),
      prisma.mozo.upsert({
        where: { dni: '37890123' },
        update: {},
        create: {
          nombre: 'Luis',
          apellido: 'Fernández',
          telefono: '3513456789',
          dni: '37890123'
        }
      })
    ]);
    console.log(`✅ ${mozos.length} mozos creados\n`);

    // 4. Crear mesas
    console.log('🪑 Creando mesas...');
    const mesas = [];
    
    // FRENTE - mesas 1-10 (capacidad 2-4 personas)
    for (let i = 1; i <= 10; i++) {
      mesas.push(
        prisma.mesa.upsert({
          where: { numero: i },
          update: {},
          create: {
            numero: i,
            capacidad: i % 2 === 0 ? 4 : 2,
            zona: 'FRENTE'
          }
        })
      );
    }

    // GALERIA - mesas 11-30 (capacidad 4-6 personas)
    for (let i = 11; i <= 30; i++) {
      mesas.push(
        prisma.mesa.upsert({
          where: { numero: i },
          update: {},
          create: {
            numero: i,
            capacidad: i % 3 === 0 ? 6 : 4,
            zona: 'GALERIA'
          }
        })
      );
    }

    // SALON - mesas 31-50 (capacidad 6-8 personas)
    for (let i = 31; i <= 50; i++) {
      mesas.push(
        prisma.mesa.upsert({
          where: { numero: i },
          update: {},
          create: {
            numero: i,
            capacidad: i % 2 === 0 ? 8 : 6,
            zona: 'SALON'
          }
        })
      );
    }

    const mesasCreadas = await Promise.all(mesas);
    console.log(`✅ ${mesasCreadas.length} mesas creadas\n`);

    // 5. Crear algunas cuentas de ejemplo (abiertas)
    console.log('📋 Creando cuentas de ejemplo...');
    
    const cuenta1 = await prisma.cuenta.create({
      data: {
        mesaId: mesasCreadas[0].id,
        mozoId: mozos[0].id,
        numeroClientes: 2
      }
    });

    // Agregar items a la cuenta 1
    await Promise.all([
      prisma.itemPedido.create({
        data: {
          cuentaId: cuenta1.id,
          productoId: productos[0].id, // Provoleta
          cantidad: 1,
          precioUnitario: productos[0].precio,
          precioTotal: productos[0].precio,
          estado: 'ENTREGADO'
        }
      }),
      prisma.itemPedido.create({
        data: {
          cuentaId: cuenta1.id,
          productoId: productos[6].id, // Bife de Chorizo
          cantidad: 2,
          precioUnitario: productos[6].precio,
          precioTotal: productos[6].precio * 2,
          estado: 'EN_COCINA'
        }
      }),
      prisma.itemPedido.create({
        data: {
          cuentaId: cuenta1.id,
          productoId: productos[15].id, // Coca Cola
          cantidad: 2,
          precioUnitario: productos[15].precio,
          precioTotal: productos[15].precio * 2,
          estado: 'ENTREGADO'
        }
      })
    ]);

    // Actualizar totales de la cuenta 1
    await prisma.cuenta.update({
      where: { id: cuenta1.id },
      data: {
        subtotal: productos[0].precio + (productos[6].precio * 2) + (productos[15].precio * 2),
        total: productos[0].precio + (productos[6].precio * 2) + (productos[15].precio * 2)
      }
    });

    const cuenta2 = await prisma.cuenta.create({
      data: {
        mesaId: mesasCreadas[15].id,
        mozoId: mozos[1].id,
        numeroClientes: 4
      }
    });

    // Agregar items a la cuenta 2
    await Promise.all([
      prisma.itemPedido.create({
        data: {
          cuentaId: cuenta2.id,
          productoId: productos[3].id, // Ravioles
          cantidad: 2,
          precioUnitario: productos[3].precio,
          precioTotal: productos[3].precio * 2,
          estado: 'LISTO'
        }
      }),
      prisma.itemPedido.create({
        data: {
          cuentaId: cuenta2.id,
          productoId: productos[8].id, // Milanesa Napolitana
          cantidad: 2,
          precioUnitario: productos[8].precio,
          precioTotal: productos[8].precio * 2,
          estado: 'LISTO'
        }
      })
    ]);

    // Actualizar totales de la cuenta 2
    await prisma.cuenta.update({
      where: { id: cuenta2.id },
      data: {
        subtotal: (productos[3].precio * 2) + (productos[8].precio * 2),
        total: (productos[3].precio * 2) + (productos[8].precio * 2)
      }
    });

    console.log(`✅ 2 cuentas de ejemplo creadas\n`);

    console.log('🎉 ¡Datos del restaurante poblados exitosamente!\n');
    console.log('Resumen:');
    console.log(`- ${categorias.length} categorías de productos`);
    console.log(`- ${productos.length} productos en el menú`);
    console.log(`- ${mozos.length} mozos registrados`);
    console.log(`- ${mesasCreadas.length} mesas configuradas`);
    console.log(`- 2 cuentas activas de ejemplo\n`);

  } catch (error) {
    console.error('❌ Error poblando datos del restaurante:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedRestaurante()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedRestaurante;