# 📊 Generación de Datos Históricos - Sistema de Reservas

Este script genera datos históricos para los **últimos 30 días** con al menos **10 clientes únicos por día** para poblar la base de datos del sistema de reservas del restaurante.

## 📅 ¿Qué datos se generan?

### Por cada día (últimos 30 días):
- **10-15 clientes únicos** con datos realistas
- **Reservas** (80% de probabilidad por cliente)
- **Visitas al restaurante** (40% de probabilidad por cliente)
- **Pedidos y cuentas** con productos variados
- **Comentarios** en reservas (30% de probabilidad)

### Datos base del sistema:
- **Categorías de productos** (Entradas, Carnes, Pescados, etc.)
- **18 productos** con precios realistas
- **5 mozos** activos
- **25 mesas** distribuidas en 3 zonas (FRENTE, GALERIA, SALON)
- **Parámetros de capacidad** del restaurante

## 🚀 Cómo ejecutar

### Opción 1: Script automatizado (recomendado)
```bash
./generar-datos-historicos.sh
```

### Opción 2: Manual
```bash
cd backend
npm install bcrypt @types/bcrypt
npx prisma generate
npm run prisma:seed-historico
```

## 📈 Estadísticas esperadas

Al finalizar tendrás aproximadamente:
- **300-450 usuarios** (clientes)
- **240-360 reservas**
- **120-180 cuentas** de restaurante
- **600-900 items de pedido**
- **18 productos** disponibles
- **5 mozos** activos
- **25 mesas** configuradas

## 🔍 Verificar los datos

Para ver los datos generados:
```bash
cd backend
npm run prisma:studio
```

Esto abrirá Prisma Studio en tu navegador donde podrás explorar todos los datos.

## 📊 Estructura de datos realistas

### Clientes
- Nombres y apellidos en español
- Emails únicos con dominios populares
- Teléfonos argentinos (+5411...)
- Fechas de creación distribuidas en los últimos 30 días

### Reservas
- Turnos: ALMUERZO y CENA
- Zonas: FRENTE (30), GALERIA (200), SALON (500 personas)
- 1-6 personas por reserva
- Estados: 75% RESERVADA, 25% CANCELADA_POR_CLIENTE

### Productos y precios (en pesos argentinos)
- **Entradas**: $170-$320
- **Carnes**: $890-$1,250
- **Pescados**: $1,350-$1,480
- **Ensaladas**: $580-$650
- **Postres**: $380-$450
- **Bebidas**: $280-$1,200

### Cuentas
- Duración realista: 30 minutos a 2 horas
- Propinas: 5-20% del subtotal
- 1-5 items por pedido
- Estados: CERRADA (completadas)

## 🧹 Limpiar datos

El script **limpia automáticamente** todos los datos existentes antes de generar los nuevos. Si necesitas conservar datos existentes, comenta las líneas de `deleteMany()` en el archivo `seed-historico.ts`.

## 🛠️ Personalizar datos

Puedes modificar el archivo `backend/prisma/seed-historico.ts` para:
- Cambiar el número de clientes por día
- Agregar más productos
- Modificar precios
- Ajustar probabilidades de reservas/visitas
- Cambiar el rango de fechas

## 📞 Soporte

Si encuentras algún problema:
1. Asegúrate de estar en la carpeta correcta
2. Verifica que tienes Node.js instalado
3. Ejecuta `npm install` en la carpeta backend
4. Revisa que la base de datos SQLite esté accesible