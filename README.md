# 🍽️ Restaurante Puente - Sistema de Reservas

Sistema web completo para gestionar reservas de mesas en un restaurante. Incluye panel de administración y área de clientes.

## 📋 Características

### Para Clientes
- Registro e inicio de sesión
- Crear nuevas reservas seleccionando fecha, turno, zona y cantidad de personas
- Ver y gestionar sus reservas futuras
- Cancelar o modificar reservas (con más de 24h de anticipación)
- Historial de reservas pasadas
- Dejar comentarios sobre visitas anteriores

### Para Responsables del Restaurante
- Panel de administración con vista diaria de reservas
- Crear reservas manuales para clientes
- Editar y cancelar cualquier reserva
- Ver ocupación por turno y zona
- Tabla de planificación con distribución por zona y tamaño de grupo
- Ver comentarios de clientes

### Reglas de Negocio
- **Días de apertura:** Martes a Sábado
- **Turnos:** Almuerzo y Cena
- **Anticipación máxima:** 30 días
- **Zonas:** Frente (30 personas), Galería (200 personas), Salón (500 personas)
- **Capacidad total:** 730 personas por turno

## 🛠️ Stack Tecnológico

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite (base de datos local)
- JWT para autenticación
- bcrypt para hash de contraseñas

### Frontend
- React 18
- TypeScript
- Vite
- React Router DOM
- Axios
- React Hot Toast

## 📦 Instalación

### Requisitos previos
- Node.js v18 o superior
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd Puente
```

### 2. Instalar y configurar el Backend

```bash
# Entrar al directorio del backend
cd backend

# Instalar dependencias
npm install

# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migraciones de la base de datos
npx prisma migrate dev --name init

# Ejecutar el seed (crea usuario admin y parámetros iniciales)
npm run prisma:seed

# Iniciar el servidor de desarrollo
npm run dev
```

El backend correrá en `http://localhost:3001`

### 3. Instalar y configurar el Frontend

```bash
# En otra terminal, entrar al directorio del frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend correrá en `http://localhost:5173`

## 🔐 Credenciales por defecto

### Usuario Administrador
- **Email/Usuario:** `admin`
- **Contraseña:** `ivo`
- **Rol:** RESPONSABLE

## 📁 Estructura del Proyecto

```
Puente/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema de base de datos
│   │   └── seed.ts            # Script de seed inicial
│   ├── src/
│   │   ├── middleware/        # Middlewares de autenticación
│   │   ├── routes/            # Rutas de la API
│   │   ├── utils/             # Utilidades y validaciones
│   │   └── index.ts           # Punto de entrada
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── context/           # Contextos de React (Auth)
│   │   ├── pages/             # Páginas de la aplicación
│   │   │   ├── cliente/       # Páginas del área cliente
│   │   │   └── admin/         # Páginas del panel admin
│   │   ├── services/          # Servicios de API
│   │   ├── types/             # Tipos TypeScript
│   │   ├── utils/             # Funciones de utilidad
│   │   ├── App.tsx            # Componente principal
│   │   └── main.tsx           # Punto de entrada
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🚀 Scripts Disponibles

### Backend
```bash
npm run dev          # Iniciar en modo desarrollo
npm run build        # Compilar TypeScript
npm run start        # Iniciar servidor compilado
npm run prisma:generate   # Generar cliente Prisma
npm run prisma:migrate    # Ejecutar migraciones
npm run prisma:seed       # Ejecutar seed
npm run prisma:studio     # Abrir Prisma Studio (GUI de BD)
```

### Frontend
```bash
npm run dev          # Iniciar en modo desarrollo
npm run build        # Compilar para producción
npm run preview      # Previsualizar build
```

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/registro` - Registro de nuevo cliente
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `PUT /api/auth/perfil` - Actualizar perfil

### Reservas
- `GET /api/reservas/disponibilidad` - Obtener disponibilidad
- `POST /api/reservas` - Crear reserva
- `GET /api/reservas/mis-reservas` - Mis reservas (cliente)
- `GET /api/reservas/:id` - Obtener reserva específica
- `PUT /api/reservas/:id` - Actualizar reserva
- `PUT /api/reservas/:id/cancelar` - Cancelar reserva

### Admin
- `GET /api/reservas/admin/todas` - Todas las reservas
- `GET /api/reservas/admin/planificacion` - Datos de planificación

### Parámetros
- `GET /api/parametros` - Obtener parámetros del restaurante
- `PUT /api/parametros` - Actualizar parámetros (admin)

### Comentarios
- `POST /api/comentarios/reserva/:id` - Agregar comentario
- `GET /api/comentarios/reserva/:id` - Obtener comentarios

## 🎨 Diseño Visual

La aplicación utiliza una paleta de colores cálidos inspirada en un restaurante con:
- Ladrillo visto
- Iluminación cálida
- Tonos marrones y beige
- Diseño limpio y profesional

## 🔧 Configuración

### Variables de entorno del Backend (.env)
```env
PORT=3001
JWT_SECRET=tu-secret-key-muy-segura
SESSION_SECRET=session-secret
NODE_ENV=development
```

## 📝 Notas adicionales

- La base de datos SQLite se crea automáticamente en `backend/prisma/dev.db`
- Las sesiones se manejan con JWT almacenado en cookies httpOnly
- El frontend hace proxy de las peticiones `/api` al backend en desarrollo
- Los clientes solo pueden modificar/cancelar reservas con más de 24h de anticipación

## 🤝 Uso

1. Accede a `http://localhost:5173`
2. Para probar como admin: login con `admin` / `ivo`
3. Para probar como cliente: registra una nueva cuenta
4. Explora las funcionalidades de reservas

---

Desarrollado con ❤️ para Restaurante Puente
