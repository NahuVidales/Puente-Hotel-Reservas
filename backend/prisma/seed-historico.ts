import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Datos de ejemplo para generar nombres aleatorios
const nombres = [
  'María', 'José', 'Antonio', 'Carmen', 'Manuel', 'Dolores', 'David', 'Francisco',
  'Ana', 'Rafael', 'Laura', 'Carlos', 'Cristina', 'Daniel', 'Isabel', 'Miguel',
  'Patricia', 'Alejandro', 'Marta', 'Pedro', 'Elena', 'Juan', 'Lucía', 'Ángel',
  'Rosa', 'Luis', 'Cristian', 'Paula', 'Sergio', 'Raquel', 'Jesús', 'Sandra',
  'Javier', 'Mónica', 'Fernando', 'Beatriz', 'Alberto', 'Rocío', 'Rubén', 'Teresa'
]

const apellidos = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez',
  'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz',
  'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez',
  'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales',
  'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias'
]

const productos = [
  { nombre: 'Empanadas de Carne', categoria: 'Entradas', precio: 180.00 },
  { nombre: 'Empanadas de Pollo', categoria: 'Entradas', precio: 170.00 },
  { nombre: 'Provoleta', categoria: 'Entradas', precio: 320.00 },
  { nombre: 'Bife de Chorizo', categoria: 'Carnes', precio: 1250.00 },
  { nombre: 'Entraña', categoria: 'Carnes', precio: 1100.00 },
  { nombre: 'Pollo a la Plancha', categoria: 'Carnes', precio: 980.00 },
  { nombre: 'Milanesa Napolitana', categoria: 'Carnes', precio: 890.00 },
  { nombre: 'Pescado del Día', categoria: 'Pescados', precio: 1350.00 },
  { nombre: 'Salmón Grillado', categoria: 'Pescados', precio: 1480.00 },
  { nombre: 'Ensalada César', categoria: 'Ensaladas', precio: 650.00 },
  { nombre: 'Ensalada Mixta', categoria: 'Ensaladas', precio: 580.00 },
  { nombre: 'Papas Fritas', categoria: 'Guarniciones', precio: 450.00 },
  { nombre: 'Pure de Papas', categoria: 'Guarniciones', precio: 420.00 },
  { nombre: 'Flan Casero', categoria: 'Postres', precio: 380.00 },
  { nombre: 'Tiramisu', categoria: 'Postres', precio: 450.00 },
  { nombre: 'Vino Malbec', categoria: 'Bebidas', precio: 1200.00 },
  { nombre: 'Agua Mineral', categoria: 'Bebidas', precio: 280.00 },
  { nombre: 'Gaseosa', categoria: 'Bebidas', precio: 350.00 }
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomDate(days: number): Date {
  const today = new Date()
  const pastDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000))
  const randomTime = pastDate.getTime() + Math.random() * (today.getTime() - pastDate.getTime())
  return new Date(randomTime)
}

function getRandomDateInDay(day: Date): Date {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(day)
  end.setHours(23, 59, 59, 999)
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function generatePhoneNumber(): string {
  return `+5411${Math.floor(Math.random() * 90000000) + 10000000}`
}

function generateEmail(nombre: string, apellido: string, index: number): string {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com']
  const domain = getRandomElement(domains)
  return `${nombre.toLowerCase()}.${apellido.toLowerCase()}${index}@${domain}`
}

async function main() {
  console.log('🚀 Iniciando creación de datos históricos...')

  // Limpiar datos existentes (opcional)
  console.log('🧹 Limpiando datos existentes...')
  await prisma.itemPedido.deleteMany({})
  await prisma.cuenta.deleteMany({})
  await prisma.historialMesa.deleteMany({})
  await prisma.comentarioReserva.deleteMany({})
  await prisma.reserva.deleteMany({})
  await prisma.producto.deleteMany({})
  await prisma.categoriaProducto.deleteMany({})
  await prisma.mesa.deleteMany({})
  await prisma.mozo.deleteMany({})
  await prisma.usuario.deleteMany({})
  await prisma.parametrosCapacidadRestaurante.deleteMany({})

  // Crear usuario administrador
  console.log('👤 Creando usuario administrador...')
  const passwordHashAdmin = await bcrypt.hash('admin', 10)
  
  await prisma.usuario.create({
    data: {
      nombre: 'Administrador',
      apellido: 'Sistema',
      telefono: '000000000',
      email: 'admin',
      passwordHash: passwordHashAdmin,
      rol: 'RESPONSABLE',
    }
  })
  
  console.log('✅ Usuario admin creado (usuario: admin, contraseña: admin)')

  // Crear parámetros de capacidad
  console.log('⚙️ Creando parámetros de capacidad...')
  await prisma.parametrosCapacidadRestaurante.create({
    data: {
      capacidadFrente: 30,
      capacidadGaleria: 200,
      capacidadSalon: 500,
      anticipacionMaximaDias: 30
    }
  })

  // Crear categorías de productos
  console.log('📋 Creando categorías de productos...')
  const categorias = ['Entradas', 'Carnes', 'Pescados', 'Ensaladas', 'Guarniciones', 'Postres', 'Bebidas']
  const categoriaMap = new Map<string, number>()
  
  for (const categoriaNombre of categorias) {
    const categoria = await prisma.categoriaProducto.create({
      data: {
        nombre: categoriaNombre,
        activa: true
      }
    })
    categoriaMap.set(categoriaNombre, categoria.id)
  }

  // Crear productos
  console.log('🍽️ Creando productos...')
  const productosCreados = []
  for (const producto of productos) {
    const categoriaId = categoriaMap.get(producto.categoria)!
    const productoCreado = await prisma.producto.create({
      data: {
        nombre: producto.nombre,
        descripcion: `Delicioso ${producto.nombre.toLowerCase()}`,
        precio: producto.precio,
        categoriaId: categoriaId,
        disponible: true,
        tiempoPreparacion: Math.floor(Math.random() * 30) + 10 // 10-40 minutos
      }
    })
    productosCreados.push(productoCreado)
  }

  // Crear mozos
  console.log('👨‍💼 Creando mozos...')
  const mozos = []
  const mozoNames = ['Carlos Pérez', 'María González', 'José Rodríguez', 'Ana Martínez', 'Luis García']
  
  for (let i = 0; i < mozoNames.length; i++) {
    const [nombre, apellido] = mozoNames[i].split(' ')
    const mozo = await prisma.mozo.create({
      data: {
        nombre,
        apellido,
        telefono: generatePhoneNumber(),
        dni: `${20000000 + i}`,
        activo: true,
        fechaIngreso: getRandomDate(180) // Contratados en los últimos 6 meses
      }
    })
    mozos.push(mozo)
  }

  // Crear mesas
  console.log('🪑 Creando mesas...')
  const mesas = []
  const zonas = ['FRENTE', 'GALERIA', 'SALON']
  
  for (let i = 1; i <= 25; i++) {
    const mesa = await prisma.mesa.create({
      data: {
        numero: i,
        capacidad: Math.floor(Math.random() * 6) + 2, // 2-8 personas
        zona: getRandomElement(zonas),
        activa: true
      }
    })
    mesas.push(mesa)
  }

  // Generar datos para los últimos 30 días
  console.log('📅 Generando datos históricos para los últimos 30 días...')
  
  const usuariosCreados = []
  let usuarioIndex = 0

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - dayOffset)
    currentDate.setHours(0, 0, 0, 0)
    
    console.log(`📆 Procesando día: ${currentDate.toISOString().split('T')[0]}`)
    
    // Crear 10-15 clientes únicos para este día
    const clientesPorDia = Math.floor(Math.random() * 6) + 10 // 10-15 clientes
    const clientesDelDia = []
    
    for (let i = 0; i < clientesPorDia; i++) {
      const nombre = getRandomElement(nombres)
      const apellido = getRandomElement(apellidos)
      const passwordHash = await bcrypt.hash('123456', 10)
      
      const usuario = await prisma.usuario.create({
        data: {
          nombre,
          apellido,
          telefono: generatePhoneNumber(),
          email: generateEmail(nombre, apellido, usuarioIndex++),
          passwordHash,
          rol: 'CLIENTE',
          fechaCreacion: getRandomDateInDay(currentDate)
        }
      })
      
      usuariosCreados.push(usuario)
      clientesDelDia.push(usuario)
    }

    // Crear reservas para estos clientes
    for (const cliente of clientesDelDia) {
      // 80% de probabilidad de que el cliente haga una reserva
      if (Math.random() < 0.8) {
        const turno = getRandomElement(['ALMUERZO', 'CENA'])
        const zona = getRandomElement(['FRENTE', 'GALERIA', 'SALON'])
        const cantidadPersonas = Math.floor(Math.random() * 6) + 1 // 1-6 personas
        
        // Fecha de la reserva puede ser el mismo día o hasta 15 días después
        const fechaReserva = new Date(currentDate)
        fechaReserva.setDate(fechaReserva.getDate() + Math.floor(Math.random() * 16))
        
        const reserva = await prisma.reserva.create({
          data: {
            clienteId: cliente.id,
            fecha: fechaReserva,
            turno,
            zona,
            cantidadPersonas,
            observaciones: Math.random() < 0.3 ? 'Mesa cerca de la ventana' : null,
            estado: getRandomElement(['RESERVADA', 'RESERVADA', 'RESERVADA', 'CANCELADA_POR_CLIENTE']), // 75% reservadas
            fechaCreacion: getRandomDateInDay(currentDate)
          }
        })

        // 30% de probabilidad de comentario en la reserva
        if (Math.random() < 0.3) {
          await prisma.comentarioReserva.create({
            data: {
              reservaId: reserva.id,
              textoComentario: getRandomElement([
                'Cliente muy amable, reserva confirmada',
                'Requiere mesa especial por celebración',
                'Cliente habitual del restaurante',
                'Solicitó menú vegetariano'
              ]),
              fechaComentario: getRandomDateInDay(currentDate)
            }
          })
        }
      }

      // Crear cuentas de restaurante (para simular visitas reales)
      // 40% de probabilidad de que hayan visitado el restaurante físicamente
      if (Math.random() < 0.4) {
        const mesa = getRandomElement(mesas)
        const mozo = getRandomElement(mozos)
        const fechaVisita = getRandomDateInDay(currentDate)
        
        const cuenta = await prisma.cuenta.create({
          data: {
            mesaId: mesa.id,
            mozoId: mozo.id,
            numeroClientes: Math.floor(Math.random() * 4) + 1, // 1-4 clientes
            fechaApertura: fechaVisita,
            fechaCierre: new Date(fechaVisita.getTime() + (Math.random() * 3600000) + 1800000), // 30min-2h después
            estado: 'CERRADA',
            subtotal: 0,
            propina: 0,
            total: 0
          }
        })

        // Agregar items al pedido
        const numItems = Math.floor(Math.random() * 5) + 1 // 1-5 items
        let subtotal = 0
        
        for (let i = 0; i < numItems; i++) {
          const producto = getRandomElement(productosCreados)
          const cantidad = Math.floor(Math.random() * 3) + 1 // 1-3 cantidad
          const precioTotal = producto.precio * cantidad
          subtotal += precioTotal
          
          await prisma.itemPedido.create({
            data: {
              cuentaId: cuenta.id,
              productoId: producto.id,
              cantidad,
              precioUnitario: producto.precio,
              precioTotal,
              estado: 'ENTREGADO',
              fechaPedido: new Date(fechaVisita.getTime() + (i * 300000)), // Items cada 5 minutos
              fechaEntrega: new Date(fechaVisita.getTime() + (i * 300000) + (Math.random() * 1200000)) // Entrega 0-20 min después
            }
          })
        }
        
        const propina = subtotal * (Math.random() * 0.15 + 0.05) // 5-20% propina
        const total = subtotal + propina
        
        // Actualizar totales de la cuenta
        await prisma.cuenta.update({
          where: { id: cuenta.id },
          data: {
            subtotal,
            propina,
            total
          }
        })

        // Crear historial de mesa
        await prisma.historialMesa.create({
          data: {
            mesaId: mesa.id,
            mozoId: mozo.id,
            fechaAsignacion: fechaVisita,
            fechaLiberacion: new Date(fechaVisita.getTime() + (Math.random() * 3600000) + 1800000)
          }
        })
      }
    }
  }

  console.log(`✅ Datos históricos creados exitosamente!`)
  console.log(`👥 Total usuarios creados: ${usuariosCreados.length}`)
  console.log(`📊 Promedio de clientes por día: ${(usuariosCreados.length / 30).toFixed(1)}`)
  
  // Estadísticas finales
  const totalReservas = await prisma.reserva.count()
  const totalCuentas = await prisma.cuenta.count()
  const totalProductos = await prisma.producto.count()
  const totalMozos = await prisma.mozo.count()
  const totalMesas = await prisma.mesa.count()
  
  console.log('\n📈 Estadísticas finales:')
  console.log(`📅 Reservas creadas: ${totalReservas}`)
  console.log(`🧾 Cuentas creadas: ${totalCuentas}`)
  console.log(`🍽️ Productos disponibles: ${totalProductos}`)
  console.log(`👨‍💼 Mozos activos: ${totalMozos}`)
  console.log(`🪑 Mesas disponibles: ${totalMesas}`)
}

main()
  .catch((e) => {
    console.error('❌ Error durante la creación de datos:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })