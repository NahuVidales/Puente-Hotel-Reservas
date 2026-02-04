import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Datos de ejemplo para generar nombres aleatorios
const nombres = [
  'María', 'José', 'Antonio', 'Carmen', 'Manuel', 'Dolores', 'David', 'Francisco',
  'Ana', 'Rafael', 'Laura', 'Carlos', 'Cristina', 'Daniel', 'Isabel', 'Miguel',
  'Patricia', 'Alejandro', 'Marta', 'Pedro', 'Elena', 'Juan', 'Lucía', 'Ángel',
  'Rosa', 'Luis', 'Cristian', 'Paula', 'Sergio', 'Raquel', 'Jesús', 'Sandra',
  'Javier', 'Mónica', 'Fernando', 'Beatriz', 'Alberto', 'Rocío', 'Rubén', 'Teresa',
  'Pablo', 'Silvia', 'Diego', 'Natalia', 'Álvaro', 'Eva', 'Adrián', 'Noelia',
  'Víctor', 'Lorena', 'Jorge', 'Irene', 'Iván', 'Sara', 'Raúl', 'Andrea',
  'Roberto', 'Claudia', 'Marcos', 'Alba', 'Mario', 'Verónica', 'Emilio', 'Sonia',
  'Gonzalo', 'Pilar', 'Óscar', 'Alicia', 'Enrique', 'Marina', 'Tomás', 'Julia',
  'Nicolás', 'Clara', 'Hugo', 'Nuria', 'Ricardo', 'Esther', 'Guillermo', 'Celia'
]

const apellidos = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez',
  'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz',
  'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez',
  'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales',
  'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias',
  'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano',
  'Prieto', 'Méndez', 'Cruz', 'Calvo', 'Gallego', 'Herrera', 'León', 'Márquez',
  'Peña', 'Cabrera', 'Vega', 'Flores', 'Campos', 'Nieto', 'Reyes', 'Aguilar'
]

const observacionesOpciones = [
  'Mesa cerca de la ventana por favor',
  'Cumpleaños - traer torta',
  'Aniversario de bodas',
  'Celebración familiar',
  'Cena de negocios importante',
  'Preferencia zona tranquila',
  'Cliente con alergia a mariscos',
  'Vegetariano en el grupo',
  'Niños pequeños - necesitan silla alta',
  'Requiere acceso para silla de ruedas',
  'Pedido especial de vino',
  'Evento corporativo',
  'Primera vez en el restaurante',
  'Cliente VIP - atención especial',
  null, null, null, null, null // Más probabilidad de no tener observación
]

const comentariosOpciones = [
  'Reserva confirmada por teléfono',
  'Cliente muy amable',
  'Requiere menú especial',
  'Solicitó decoración especial',
  'Cliente habitual del restaurante',
  'Pidió confirmar el día anterior',
  'Grupo grande, preparar mesas',
  'Celebración especial',
  'Necesita estacionamiento',
  'Reserva de última hora'
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function generatePhoneNumber(): string {
  return `+5411${Math.floor(Math.random() * 90000000) + 10000000}`
}

function generateUniqueEmail(nombre: string, apellido: string, timestamp: number): string {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.com', 'icloud.com']
  const domain = getRandomElement(domains)
  const random = Math.floor(Math.random() * 9999)
  return `${nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${apellido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}${timestamp}${random}@${domain}`
}

// Generar fecha futura dentro de los próximos N días
function getFutureDate(maxDays: number): Date {
  const today = new Date()
  today.setHours(12, 0, 0, 0) // Mediodía para evitar problemas de timezone
  const daysToAdd = Math.floor(Math.random() * maxDays) + 1
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + daysToAdd)
  return futureDate
}

// Verificar si es día de apertura (martes a sábado)
function esDiaApertura(fecha: Date): boolean {
  const dia = fecha.getDay() // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
  return dia >= 2 && dia <= 6 // Martes a Sábado
}

// Obtener próximo día de apertura
function getProximoDiaApertura(fecha: Date): Date {
  const nuevaFecha = new Date(fecha)
  while (!esDiaApertura(nuevaFecha)) {
    nuevaFecha.setDate(nuevaFecha.getDate() + 1)
  }
  return nuevaFecha
}

async function main() {
  console.log('🚀 Iniciando creación de clientes y reservas futuras...\n')

  const TOTAL_CLIENTES_OBJETIVO = 250 // Mínimo 200, generamos 250 para buena cobertura
  const DIAS_FUTUROS = 30

  // Obtener el último ID de usuario para evitar colisiones de email
  const ultimoUsuario = await prisma.usuario.findFirst({
    orderBy: { id: 'desc' }
  })
  let baseTimestamp = ultimoUsuario ? ultimoUsuario.id * 1000 : Date.now()

  // Calcular cuántos clientes crear por día (distribuidos uniformemente con variación)
  const clientesPorDia = Math.ceil(TOTAL_CLIENTES_OBJETIVO / DIAS_FUTUROS) // ~8-9 por día
  
  const usuariosCreados: any[] = []
  const reservasCreadas: any[] = []
  const passwordHash = await bcrypt.hash('123456', 10)

  console.log(`📊 Configuración:`)
  console.log(`   - Total clientes objetivo: ${TOTAL_CLIENTES_OBJETIVO}`)
  console.log(`   - Días futuros: ${DIAS_FUTUROS}`)
  console.log(`   - Clientes promedio por día: ${clientesPorDia}\n`)

  // Generar fechas de los próximos 30 días (solo días de apertura)
  const fechasFuturas: Date[] = []
  const hoy = new Date()
  hoy.setHours(12, 0, 0, 0)
  
  for (let i = 1; i <= DIAS_FUTUROS; i++) {
    const fecha = new Date(hoy)
    fecha.setDate(fecha.getDate() + i)
    if (esDiaApertura(fecha)) {
      fechasFuturas.push(fecha)
    }
  }

  console.log(`📅 Días de apertura en los próximos 30 días: ${fechasFuturas.length}\n`)

  // Distribuir clientes en los días de apertura
  const clientesPorDiaReal = Math.ceil(TOTAL_CLIENTES_OBJETIVO / fechasFuturas.length)

  let clienteIndex = 0

  for (const fechaReserva of fechasFuturas) {
    const fechaStr = fechaReserva.toISOString().split('T')[0]
    const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fechaReserva.getDay()]
    
    // Variación: generar entre 6-12 clientes por día
    const numClientes = Math.floor(Math.random() * 7) + 6

    console.log(`📆 ${diaSemana} ${fechaStr}: Generando ${numClientes} clientes...`)

    for (let i = 0; i < numClientes && usuariosCreados.length < TOTAL_CLIENTES_OBJETIVO; i++) {
      const nombre = getRandomElement(nombres)
      const apellido = getRandomElement(apellidos)
      baseTimestamp++

      try {
        // Crear usuario/cliente
        const usuario = await prisma.usuario.create({
          data: {
            nombre,
            apellido,
            telefono: generatePhoneNumber(),
            email: generateUniqueEmail(nombre, apellido, baseTimestamp),
            passwordHash,
            rol: 'CLIENTE',
            fechaCreacion: new Date() // Fecha de registro: hoy
          }
        })

        usuariosCreados.push(usuario)

        // Crear reserva para este cliente
        const turno = getRandomElement(['ALMUERZO', 'CENA'])
        const zona = getRandomElement(['FRENTE', 'GALERIA', 'SALON'])
        const cantidadPersonas = Math.floor(Math.random() * 8) + 1 // 1-8 personas
        const observacion = getRandomElement(observacionesOpciones)

        // La mayoría de reservas están activas (90%)
        const estadoReserva = Math.random() < 0.9 ? 'RESERVADA' : 
                             (Math.random() < 0.5 ? 'CANCELADA_POR_CLIENTE' : 'CANCELADA_POR_RESTAURANTE')

        const reserva = await prisma.reserva.create({
          data: {
            clienteId: usuario.id,
            fecha: fechaReserva,
            turno,
            zona,
            cantidadPersonas,
            observaciones: observacion,
            estado: estadoReserva,
            fechaCreacion: new Date()
          }
        })

        reservasCreadas.push(reserva)

        // 25% de probabilidad de agregar un comentario a la reserva
        if (Math.random() < 0.25) {
          await prisma.comentarioReserva.create({
            data: {
              reservaId: reserva.id,
              textoComentario: getRandomElement(comentariosOpciones),
              fechaComentario: new Date()
            }
          })
        }

        clienteIndex++
      } catch (error: any) {
        // Si hay error de email duplicado, continuar
        if (error.code === 'P2002') {
          console.log(`   ⚠️ Email duplicado, reintentando...`)
          i-- // Reintentar
          baseTimestamp++
        } else {
          throw error
        }
      }
    }
  }

  // Generar algunos clientes adicionales con reservas distribuidas aleatoriamente
  const clientesFaltantes = TOTAL_CLIENTES_OBJETIVO - usuariosCreados.length
  if (clientesFaltantes > 0) {
    console.log(`\n🔄 Generando ${clientesFaltantes} clientes adicionales...`)
    
    for (let i = 0; i < clientesFaltantes; i++) {
      const nombre = getRandomElement(nombres)
      const apellido = getRandomElement(apellidos)
      baseTimestamp++

      try {
        const usuario = await prisma.usuario.create({
          data: {
            nombre,
            apellido,
            telefono: generatePhoneNumber(),
            email: generateUniqueEmail(nombre, apellido, baseTimestamp),
            passwordHash,
            rol: 'CLIENTE',
            fechaCreacion: new Date()
          }
        })

        usuariosCreados.push(usuario)

        // Asignar a un día aleatorio de apertura
        const fechaReserva = getRandomElement(fechasFuturas)
        const turno = getRandomElement(['ALMUERZO', 'CENA'])
        const zona = getRandomElement(['FRENTE', 'GALERIA', 'SALON'])
        const cantidadPersonas = Math.floor(Math.random() * 8) + 1

        const reserva = await prisma.reserva.create({
          data: {
            clienteId: usuario.id,
            fecha: fechaReserva,
            turno,
            zona,
            cantidadPersonas,
            observaciones: getRandomElement(observacionesOpciones),
            estado: Math.random() < 0.9 ? 'RESERVADA' : 'CANCELADA_POR_CLIENTE',
            fechaCreacion: new Date()
          }
        })

        reservasCreadas.push(reserva)
      } catch (error: any) {
        if (error.code === 'P2002') {
          baseTimestamp++
          i--
        } else {
          throw error
        }
      }
    }
  }

  // Estadísticas finales
  console.log('\n' + '='.repeat(60))
  console.log('✅ ¡GENERACIÓN COMPLETADA EXITOSAMENTE!')
  console.log('='.repeat(60))
  
  console.log(`\n👥 Total clientes creados: ${usuariosCreados.length}`)
  console.log(`📅 Total reservas creadas: ${reservasCreadas.length}`)

  // Contar reservas por estado
  const reservadasCount = reservasCreadas.filter(r => r.estado === 'RESERVADA').length
  const canceladasClienteCount = reservasCreadas.filter(r => r.estado === 'CANCELADA_POR_CLIENTE').length
  const canceladasRestCount = reservasCreadas.filter(r => r.estado === 'CANCELADA_POR_RESTAURANTE').length

  console.log(`\n📊 Desglose de reservas:`)
  console.log(`   ✅ Activas (RESERVADA): ${reservadasCount}`)
  console.log(`   ❌ Canceladas por cliente: ${canceladasClienteCount}`)
  console.log(`   ❌ Canceladas por restaurante: ${canceladasRestCount}`)

  // Contar reservas por zona
  const frenteCount = reservasCreadas.filter(r => r.zona === 'FRENTE').length
  const galeriaCount = reservasCreadas.filter(r => r.zona === 'GALERIA').length
  const salonCount = reservasCreadas.filter(r => r.zona === 'SALON').length

  console.log(`\n🏠 Distribución por zona:`)
  console.log(`   🌳 Frente: ${frenteCount} reservas`)
  console.log(`   🏛️ Galería: ${galeriaCount} reservas`)
  console.log(`   🎪 Salón: ${salonCount} reservas`)

  // Contar reservas por turno
  const almuerzoCount = reservasCreadas.filter(r => r.turno === 'ALMUERZO').length
  const cenaCount = reservasCreadas.filter(r => r.turno === 'CENA').length

  console.log(`\n🕐 Distribución por turno:`)
  console.log(`   🌞 Almuerzo: ${almuerzoCount} reservas`)
  console.log(`   🌙 Cena: ${cenaCount} reservas`)

  // Mostrar distribución por fecha
  console.log(`\n📆 Distribución de reservas por fecha:`)
  const reservasPorFecha = new Map<string, number>()
  for (const reserva of reservasCreadas) {
    const fechaStr = reserva.fecha.toISOString().split('T')[0]
    reservasPorFecha.set(fechaStr, (reservasPorFecha.get(fechaStr) || 0) + 1)
  }
  
  const fechasOrdenadas = Array.from(reservasPorFecha.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  for (const [fecha, cantidad] of fechasOrdenadas) {
    const barras = '█'.repeat(Math.ceil(cantidad / 2))
    console.log(`   ${fecha}: ${barras} (${cantidad})`)
  }

  // Totales en la base de datos
  const totalUsuarios = await prisma.usuario.count()
  const totalReservas = await prisma.reserva.count()
  const totalClientes = await prisma.usuario.count({ where: { rol: 'CLIENTE' } })

  console.log(`\n📈 Totales en la base de datos:`)
  console.log(`   👥 Total usuarios: ${totalUsuarios}`)
  console.log(`   👤 Total clientes: ${totalClientes}`)
  console.log(`   📅 Total reservas: ${totalReservas}`)

  console.log(`\n🔐 Contraseña de todos los clientes: 123456`)
}

main()
  .catch((e) => {
    console.error('❌ Error durante la creación de datos:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
