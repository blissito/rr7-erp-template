# rr7-erp-template

[![React Router](https://img.shields.io/badge/React%20Router-v7-CA4245?logo=react-router)](https://reactrouter.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org)

Template base para sistemas ERP con React Router v7 + MongoDB + Tailwind CSS.

## Stack

- **Framework:** React Router v7 (Remix)
- **Runtime:** Node.js 18+ / Deno
- **Base de datos:** PostgreSQL (Deno Deploy) + Drizzle ORM
- **Estilos:** Tailwind CSS
- **Autenticacion:** JWT + Cookies seguras
- **Validacion:** Zod

## Inicio Rapido

```bash
# 1. Clonar o usar como template
git clone https://github.com/blissito/rr7-erp-template.git mi-erp
cd mi-erp

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (MongoDB, JWT secrets, etc.)

# 4. Ejecutar en desarrollo
npm run dev
```

5. Configurar base de datos
```bash
# Opción A: Desarrollo local con PostgreSQL
# Instala PostgreSQL y crea una base de datos
# Actualiza DATABASE_URL en .env

# Opción B: Usar Deno Deploy
# 1. Crea un proyecto en https://dash.deno.com
# 2. Habilita PostgreSQL en tu proyecto
# 3. Copia el DATABASE_URL a tu .env

# Aplicar schema a la base de datos
npm run db:push
```

Abre http://localhost:3000 y listo! 🚀

## Personalizacion

### Variables de Entorno

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL | postgresql://localhost:5432/erp |
| `JWT_SECRET` | Secreto para tokens JWT | (requerido en prod) |
| `SESSION_SECRET` | Secreto para cookies | (requerido en prod) |
| `APP_NAME` | Nombre del sistema | RR7 ERP |
| `APP_DESCRIPTION` | Descripcion en login | Sistema de gestion empresarial |
| `ENABLE_CARRIL` | Campo carril en horarios | false |

**📚 Guías detalladas:**
- [DATABASE.md](./DATABASE.md) - Configurar PostgreSQL (local o Deno Deploy)
- [DENO_SETUP.md](./DENO_SETUP.md) - Deploy completo en Deno Deploy

### Colores

El sistema usa variables CSS personalizables. Editar en `app/tailwind.css`:

```css
@theme {
  /* Colores primarios - cambiar el valor hue (205) para otro color */
  --color-primary-50: oklch(0.97 0.02 205);
  --color-primary-100: oklch(0.93 0.04 205);
  --color-primary-200: oklch(0.88 0.08 205);
  --color-primary-300: oklch(0.79 0.12 205);
  --color-primary-400: oklch(0.68 0.16 205);
  --color-primary-500: oklch(0.60 0.18 205);
  --color-primary-600: oklch(0.52 0.17 205);
  --color-primary-700: oklch(0.45 0.15 205);
  --color-primary-800: oklch(0.38 0.12 205);
  --color-primary-900: oklch(0.32 0.09 205);
}
```

Ejemplos de hue:
- 205 = Azul (default)
- 150 = Verde
- 30 = Naranja
- 280 = Morado
- 350 = Rojo/Rosa

### Configuracion de App

Editar `app/config/app.config.ts`:

```typescript
export const APP_CONFIG = {
  name: process.env.APP_NAME || "Mi ERP",
  description: process.env.APP_DESCRIPTION || "Mi sistema personalizado",
  domainFields: {
    scheduleCarril: process.env.ENABLE_CARRIL === "true",
  },
};
```

## Base de Datos

El sistema incluye **10 tablas** completamente configuradas:

| Tabla | Descripción | Emoji |
|-------|-------------|:-----:|
| **users** | Autenticación y usuarios del sistema | 👤 |
| **members** | Clientes/Miembros del gimnasio/club | 🏃 |
| **classes** | Clases y actividades disponibles | 📚 |
| **instructors** | Instructores y sus especialidades | 👨‍🏫 |
| **schedules** | Horarios semanales de clases | 📅 |
| **membership_types** | Tipos de membresías disponibles | 💎 |
| **member_memberships** | Membresías activas de cada miembro | 🎟️ |
| **enrollments** | Inscripciones a clases específicas | ✍️ |
| **access_logs** | Control de entradas/salidas | 🚪 |
| **audit_logs** | Auditoría de acciones del sistema | 📝 |

## Modulos Incluidos

- 👤 **Autenticacion** - JWT con access + refresh tokens
- 👥 **Gestion de usuarios** - CRUD con roles (admin/usuario)
- 🛡️ **Rate limiting** - Proteccion contra fuerza bruta en login
- 🏃 **Miembros/Clientes** - CRUD completo con busqueda
- 📚 **Clases/Actividades** - Catalogo con niveles y capacidad
- 📅 **Horarios** - Calendario semanal interactivo
- 👨‍🏫 **Instructores** - Gestion con especialidades
- 💎 **Membresias/Suscripciones** - Tipos, asignacion y renovacion
- 🚪 **Control de acceso** - Registro de entradas/salidas
- 📊 **Dashboard** - Estadisticas en tiempo real
- 📈 **Reportes** - Metricas de ingresos y actividad
- 📝 **Auditoria** - Log de acciones de usuarios

## Seguridad

| Aspecto | Implementacion |
|---------|----------------|
| Tokens | Access 15min + Refresh 7 dias |
| Contrasenas | bcrypt 10 rounds, politica estricta |
| Cookies | httpOnly, sameSite: lax, secure en prod |
| Rate limit | 5 intentos / 15 min |
| Validacion | Zod en todas las rutas |
| ObjectIds | Verificacion antes de queries |

## Estructura del Proyecto

```
app/
├── config/         # Configuracion centralizada
├── components/     # Componentes reutilizables
│   ├── layout/     # Header, Sidebar, PageHeader
│   └── ui/         # Button, Input, Card, Badge, etc.
├── lib/            # Utilidades y configuracion
│   ├── auth.server.ts       # Logica de autenticacion
│   ├── session.server.ts    # Manejo de sesiones
│   ├── rate-limit.server.ts # Rate limiting
│   └── utils/               # Helpers varios
├── models/         # Schemas de Mongoose
└── routes/         # Rutas de React Router
    ├── acceso.tsx          # Control de acceso
    ├── clases/             # CRUD de clases
    ├── config/             # Configuracion del sistema
    ├── dashboard.tsx       # Dashboard principal
    ├── horarios.tsx        # Calendario de horarios
    ├── instructores/       # CRUD de instructores
    ├── miembros/           # CRUD de miembros
    └── reportes.tsx        # Reportes y estadisticas
```

## Scripts

```bash
# Desarrollo
npm run dev       # Desarrollo con hot reload (puerto 3000)

# Base de datos (Drizzle)
npm run db:push   # Aplicar schema a la DB (desarrollo)
npm run db:generate  # Generar migraciones
npm run db:migrate   # Ejecutar migraciones
npm run db:studio    # Abrir Drizzle Studio (GUI)

# Producción
npm run build     # Build para produccion
npm run start     # Ejecutar build de produccion
npm run typecheck # Verificar tipos de TypeScript
npm run seed      # Poblar base de datos con datos de ejemplo
```

## Despliegue

### Deno Deploy (Recomendado) 🚀

Deploy en edge con PostgreSQL incluido y cold starts ultra-rápidos:

**Ver guía completa:** [DENO_SETUP.md](./DENO_SETUP.md)

```bash
# Quick start
1. Crea proyecto en https://dash.deno.com
2. Habilita PostgreSQL en Settings
3. Configura env vars
4. Deploy desde GitHub o deployctl
```

**Free tier:** 100k requests/día + PostgreSQL incluido

### Fly.io

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Crear app (primera vez)
fly launch

# Configurar secretos
fly secrets set MONGODB_URI="mongodb+srv://..." JWT_SECRET="..." SESSION_SECRET="..."

# Desplegar
fly deploy
```

### Docker

```bash
docker build -t mi-erp .
docker run -p 3000:3000 -e MONGODB_URI=... mi-erp
```

## Extendiendo el Template

### Agregar un nuevo modelo

1. Crear schema en `app/models/nuevo.server.ts`
2. Crear rutas en `app/routes/nuevo/`
3. Agregar enlace en `app/components/layout/sidebar.tsx`

### Agregar campos de dominio

1. Agregar variable en `app/config/app.config.ts`
2. Agregar variable de entorno en `.env.example`
3. Condicionar UI con `APP_CONFIG.domainFields.tuCampo`

## Opciones Avanzadas

### Deploy con Deno Deploy

Si quieres explorar deployment en edge con Deno Deploy, revisa la documentación avanzada:
- [docs/advanced/QUICKSTART_DENO.md](./docs/advanced/QUICKSTART_DENO.md)
- [docs/advanced/DENO_DEPLOY.md](./docs/advanced/DENO_DEPLOY.md)

El proyecto incluye configuración para Deno Deploy pero funciona perfectamente con npm/Node.js tradicional.

## Licencia

MIT
