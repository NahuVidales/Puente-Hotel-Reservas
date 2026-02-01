# 🍽️ Sistema de Gestión de Restaurante - Puente Hotel

Sistema completo de gestión restaurantera con más de 30 años de experiencia aplicada. Integra reservas de mesas con gestión operativa del restaurante: productos, mozos, mesas y cuentas.

## 📋 Características Principales

### Módulo de Reservas (Existente)
- ✅ Gestión de reservas por fecha, turno y zona
- ✅ Control de capacidad por zonas (Frente, Galería, Salón)
- ✅ Sistema de usuarios y autenticación
- ✅ Comentarios y seguimiento de reservas

### Módulo de Restaurante (Nuevo) 🆕
- 🍕 **Gestión de Productos**: Menú completo con categorías, precios y tiempos de preparación
- 🪑 **Gestión de Mesas**: Control de 50 mesas distribuidas en 3 zonas con estados en tiempo real
- 👨‍🍳 **Gestión de Mozos**: Personal, asignación de mesas y estadísticas de rendimiento
- 📋 **Gestión de Cuentas**: Órdenes, seguimiento de items, estados de cocina y cierre de cuentas
- 📊 **Dashboard en Tiempo Real**: Ocupación, ventas y métricas operativas

## 🏗️ Arquitectura

### Backend
- **Framework**: Express.js + TypeScript
- **Base de Datos**: SQLite con Prisma ORM
- **Autenticación**: JWT con cookies seguras
- **API**: REST con validaciones completas

### Frontend
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **Estilos**: CSS Modules
- **HTTP Client**: Axios

## 📦 Instalación

### Requisitos Previos
- Node.js 18+ y npm
- Git

### Configuración Backend

```bash
cd backend

# Instalar dependencias
npm install

# Aplicar esquema de base de datos
npx prisma db push

# Poblar datos de ejemplo (productos, mozos, mesas)
npx tsx prisma/seed-restaurante.ts

# Iniciar servidor (http://localhost:3001)
npm run dev
```

### Configuración Frontend

```bash
cd frontend

# Instalar dependencias (ignorar peer deps)
npm install --legacy-peer-deps

# Iniciar aplicación (http://localhost:5173)
npm run dev
```

## 🗂️ Estructura de Base de Datos

### Nuevos Modelos Restaurante

#### CategoriaProducto
- Categorización del menú (Entradas, Platos Principales, Pastas, Carnes, Pescados, Postres, Bebidas, Vinos)

#### Producto
- Menú completo con precios, descripciones y tiempos de preparación
- Relación con categorías
- Control de disponibilidad

#### Mozo
- Datos personales (nombre, apellido, DNI, teléfono)
- Estado activo/inactivo
- Fecha de ingreso
- Estadísticas de ventas

#### Mesa
- Número único, capacidad y zona
- Estados: LIBRE / OCUPADA
- Relación con cuentas activas

#### Cuenta
- Mesa y mozo asignados
- Items del pedido con estados
- Subtotal, propina y total
- Estados: ABIERTA / CERRADA / CANCELADA
- Timestamps de apertura y cierre

#### ItemPedido
- Producto, cantidad y precios
- Estados: PENDIENTE → EN_COCINA → LISTO → ENTREGADO
- Observaciones especiales
- Timestamps de pedido y entrega

#### HistorialMesa
- Auditoría de asignaciones
- Fechas de asignación y liberación

## 🛣️ Endpoints API

### Productos
```
GET    /api/productos              - Listar productos
GET    /api/productos/categorias   - Listar categorías
POST   /api/productos/categorias   - Crear categoría
POST   /api/productos              - Crear producto
PUT    /api/productos/:id          - Actualizar producto
DELETE /api/productos/:id          - Desactivar producto
```

### Mesas
```
GET    /api/mesas                  - Listar mesas con estado
GET    /api/mesas/ocupacion        - Ocupación por zonas
POST   /api/mesas                  - Crear mesa
PUT    /api/mesas/:id              - Actualizar mesa
DELETE /api/mesas/:id              - Desactivar mesa
```

### Mozos
```
GET    /api/mozos                      - Listar mozos con estadísticas
GET    /api/mozos/:id/estadisticas     - Estadísticas detalladas
POST   /api/mozos                      - Crear mozo
PUT    /api/mozos/:id                  - Actualizar mozo
DELETE /api/mozos/:id                  - Desactivar mozo
```

### Cuentas
```
GET    /api/cuentas                    - Listar cuentas (con filtros)
GET    /api/cuentas/:id                - Detalle de cuenta
POST   /api/cuentas                    - Abrir nueva cuenta
POST   /api/cuentas/:id/items          - Agregar item a cuenta
PUT    /api/cuentas/:id/items/:itemId  - Actualizar estado de item
PUT    /api/cuentas/:id/cerrar         - Cerrar cuenta con propina
```

## 🎨 Páginas Frontend

### RestaurantePage (Dashboard Principal)
- Estadísticas en tiempo real
- Ocupación por zonas con gráficos
- Acceso rápido a módulos
- Cuentas abiertas recientes

### ProductosPage
- CRUD completo de productos
- Gestión de categorías
- Búsqueda y filtros
- Control de disponibilidad

### MesasPage
- Mapa visual de mesas
- Estados en tiempo real
- Asignación de mozos
- Historial de ocupación

### MozosPage
- Gestión de personal
- Estadísticas de rendimiento
- Mesas asignadas
- Control de horarios

### CuentasPage
- Gestión de órdenes
- Estados de cocina
- Cálculo automático de totales
- Cierre de cuentas con propinas

## 🔐 Autenticación

Todas las rutas de modificación (POST, PUT, DELETE) están protegidas con el middleware `verificarToken`. Se requiere:
- Token JWT válido en cookie o header Authorization
- Usuario registrado en el sistema

## 📊 Datos de Ejemplo

El seed incluye:
- **8 categorías** de productos
- **19 productos** del menú con precios realistas
- **5 mozos** con datos completos
- **50 mesas** distribuidas en 3 zonas:
  - Frente: mesas 1-10 (2-4 personas)
  - Galería: mesas 11-30 (4-6 personas)
  - Salón: mesas 31-50 (6-8 personas)
- **2 cuentas** de ejemplo con items en diferentes estados

## 🚀 Flujo de Trabajo

1. **Apertura de Mesa**: Mozo asigna mesa → Se crea cuenta
2. **Toma de Pedido**: Agregar items → Estado PENDIENTE
3. **Cocina**: Items pasan a EN_COCINA → LISTO
4. **Entrega**: Mozo marca como ENTREGADO
5. **Cierre**: Calcular total + propina → Cerrar cuenta → Mesa liberada

## 🔧 Servicios Frontend

Todos los servicios están tipados con TypeScript e incluyen:
- **productos.service.ts**: CRUD productos y categorías
- **mesas.service.ts**: Gestión y ocupación de mesas
- **mozos.service.ts**: Personal y estadísticas
- **cuentas.service.ts**: Órdenes completas con validaciones

## 🎯 Mejores Prácticas Aplicadas

- ✅ Validaciones completas en backend y frontend
- ✅ Tipado estricto con TypeScript
- ✅ Manejo centralizado de errores
- ✅ Estados de carga (loading, error, success)
- ✅ Confirmaciones para acciones destructivas
- ✅ Actualización en tiempo real
- ✅ Responsive design
- ✅ Accesibilidad (a11y)
- ✅ Seguridad (JWT, CORS, sanitización)

## 📝 Próximas Características

- [ ] Reportes de ventas por período
- [ ] Sistema de turnos para mozos
- [ ] Integración con cocina (pantalla chef)
- [ ] Comandas impresas
- [ ] Estadísticas avanzadas
- [ ] Sistema de inventario
- [ ] Integración con POS
- [ ] App móvil para mozos

## 🤝 Contribución

Este sistema ha sido desarrollado con más de 30 años de experiencia en el rubro restaurantero, aplicando las mejores prácticas operativas del sector.

## 📄 Licencia

Privado - Puente Hotel Reservas

---

**Desarrollado con ❤️ para Puente Hotel**
*Sistema profesional de gestión restaurantera*