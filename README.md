# rr7-erp-template

Template base para sistemas ERP con React Router v7 + MongoDB + Tailwind CSS.

## Stack

- **Framework:** React Router v7 (Remix)
- **Base de datos:** MongoDB + Mongoose
- **Estilos:** Tailwind CSS
- **Autenticacion:** JWT + Cookies seguras
- **Validacion:** Zod

## Inicio Rapido

```bash
# 1. Usar como template o clonar
npx degit usuario/rr7-erp-template mi-erp
cd mi-erp

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Ejecutar
npm run dev
```

## Personalizacion

### Variables de Entorno

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `APP_NAME` | Nombre del sistema | RR7 ERP |
| `APP_DESCRIPTION` | Descripcion en login | Sistema de gestion empresarial |
| `MONGODB_URI` | URL de MongoDB | localhost:27017/erp |
| `JWT_SECRET` | Secreto para tokens JWT | (requerido en prod) |
| `SESSION_SECRET` | Secreto para cookies | (requerido en prod) |
| `ENABLE_CARRIL` | Campo carril en horarios | false |

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

## Modulos Incluidos

- **Autenticacion** - JWT con access + refresh tokens
- **Gestion de usuarios** - CRUD con roles (admin/usuario)
- **Rate limiting** - Proteccion contra fuerza bruta en login
- **Miembros/Clientes** - CRUD completo con busqueda
- **Clases/Actividades** - Catalogo con niveles y capacidad
- **Horarios** - Calendario semanal interactivo
- **Instructores** - Gestion con especialidades
- **Membresias/Suscripciones** - Tipos, asignacion y renovacion
- **Control de acceso** - Registro de entradas/salidas
- **Dashboard** - Estadisticas en tiempo real
- **Reportes** - Metricas de ingresos y actividad
- **Auditoria** - Log de acciones de usuarios

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
npm run dev       # Desarrollo con hot reload
npm run build     # Build para produccion
npm run start     # Ejecutar build de produccion
npm run typecheck # Verificar tipos de TypeScript
npm run seed      # Poblar base de datos con datos de ejemplo
```

## Despliegue

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

## Licencia

MIT
