import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📊 ESTADÍSTICAS DE DATOS HISTÓRICOS')
  console.log('=====================================\n')

  // Estadísticas generales
  const totalUsuarios = await prisma.usuario.count()
  const totalReservas = await prisma.reserva.count()
  const totalCuentas = await prisma.cuenta.count()
  const totalProductos = await prisma.producto.count()
  const totalMozos = await prisma.mozo.count()
  const totalMesas = await prisma.mesa.count()
  
  console.log('📈 TOTALES GENERALES:')
  console.log(`👥 Usuarios: ${totalUsuarios}`)
  console.log(`📅 Reservas: ${totalReservas}`)
  console.log(`🧾 Cuentas: ${totalCuentas}`)
  console.log(`🍽️ Productos: ${totalProductos}`)
  console.log(`👨‍💼 Mozos: ${totalMozos}`)
  console.log(`🪑 Mesas: ${totalMesas}\n`)

  // Estadísticas por día (últimos 7 días)
  console.log('📅 CLIENTES POR DÍA (últimos 7 días):')
  const hoy = new Date()
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(hoy)
    fecha.setDate(fecha.getDate() - i)
    fecha.setHours(0, 0, 0, 0)
    
    const fechaSiguiente = new Date(fecha)
    fechaSiguiente.setDate(fechaSiguiente.getDate() + 1)
    
    const clientesDelDia = await prisma.usuario.count({
      where: {
        fechaCreacion: {
          gte: fecha,
          lt: fechaSiguiente
        }
      }
    })
    
    const reservasDelDia = await prisma.reserva.count({
      where: {
        fechaCreacion: {
          gte: fecha,
          lt: fechaSiguiente
        }
      }
    })
    
    const cuentasDelDia = await prisma.cuenta.count({
      where: {
        fechaApertura: {
          gte: fecha,
          lt: fechaSiguiente
        }
      }
    })
    
    const fechaStr = fecha.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit' 
    })
    
    console.log(`${fechaStr}: ${clientesDelDia} clientes, ${reservasDelDia} reservas, ${cuentasDelDia} cuentas`)
  }

  // Estadísticas de reservas por estado
  console.log('\n📋 RESERVAS POR ESTADO:')
  const estadosReserva = await prisma.reserva.groupBy({
    by: ['estado'],
    _count: {
      estado: true
    }
  })
  
  estadosReserva.forEach(estado => {
    const porcentaje = ((estado._count.estado / totalReservas) * 100).toFixed(1)
    console.log(`${estado.estado}: ${estado._count.estado} (${porcentaje}%)`)
  })

  // Estadísticas de reservas por zona
  console.log('\n🏠 RESERVAS POR ZONA:')
  const zonas = await prisma.reserva.groupBy({
    by: ['zona'],
    _count: {
      zona: true
    }
  })
  
  zonas.forEach(zona => {
    const porcentaje = ((zona._count.zona / totalReservas) * 100).toFixed(1)
    console.log(`${zona.zona}: ${zona._count.zona} (${porcentaje}%)`)
  })

  // Estadísticas de turnos
  console.log('\n🍽️ RESERVAS POR TURNO:')
  const turnos = await prisma.reserva.groupBy({
    by: ['turno'],
    _count: {
      turno: true
    }
  })
  
  turnos.forEach(turno => {
    const porcentaje = ((turno._count.turno / totalReservas) * 100).toFixed(1)
    console.log(`${turno.turno}: ${turno._count.turno} (${porcentaje}%)`)
  })

  // Ingresos totales
  console.log('\n💰 INGRESOS TOTALES:')
  const ingresos = await prisma.cuenta.aggregate({
    _sum: {
      total: true,
      subtotal: true,
      propina: true
    }
  })
  
  if (ingresos._sum.total) {
    console.log(`💵 Total facturado: $${ingresos._sum.total.toFixed(2)}`)
    console.log(`🧾 Subtotal: $${ingresos._sum.subtotal?.toFixed(2)}`)
    console.log(`🎉 Propinas: $${ingresos._sum.propina?.toFixed(2)}`)
    console.log(`📊 Ticket promedio: $${(ingresos._sum.total / totalCuentas).toFixed(2)}`)
  }

  // Top 5 productos más vendidos
  console.log('\n🏆 TOP 5 PRODUCTOS MÁS VENDIDOS:')
  const topProductos = await prisma.itemPedido.groupBy({
    by: ['productoId'],
    _sum: {
      cantidad: true,
      precioTotal: true
    },
    orderBy: {
      _sum: {
        cantidad: 'desc'
      }
    },
    take: 5
  })

  for (const item of topProductos) {
    const producto = await prisma.producto.findUnique({
      where: { id: item.productoId }
    })
    console.log(`${producto?.nombre}: ${item._sum.cantidad} vendidos ($${item._sum.precioTotal?.toFixed(2)})`)
  }

  // Mozos más activos
  console.log('\n👨‍💼 MOZOS MÁS ACTIVOS:')
  const mozoStats = await prisma.cuenta.groupBy({
    by: ['mozoId'],
    _count: {
      mozoId: true
    },
    _sum: {
      total: true
    },
    orderBy: {
      _count: {
        mozoId: 'desc'
      }
    }
  })

  for (const stat of mozoStats) {
    const mozo = await prisma.mozo.findUnique({
      where: { id: stat.mozoId }
    })
    console.log(`${mozo?.nombre} ${mozo?.apellido}: ${stat._count.mozoId} cuentas ($${stat._sum.total?.toFixed(2)})`)
  }

  console.log('\n✅ Estadísticas generadas exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })