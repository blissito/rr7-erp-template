# Configuración de Base de Datos

Este proyecto usa **PostgreSQL** con **Drizzle ORM**.

## Opciones de Base de Datos

### Opción 1: PostgreSQL de Deno Deploy (Recomendado para producción)

Deno Deploy proporciona PostgreSQL gratis con tu proyecto:

1. **Crea un proyecto en Deno Deploy:**
   - Ve a https://dash.deno.com
   - Crea un nuevo proyecto
   - Ve a **Settings** → **Databases** → **PostgreSQL**
   - Habilita PostgreSQL

2. **Obtén tu DATABASE_URL:**
   - Deno Deploy te dará un `DATABASE_URL` automáticamente
   - Cópialo a tu archivo `.env` local

3. **Aplica el schema:**
   ```bash
   npm run db:push
   ```

### Opción 2: PostgreSQL Local (Desarrollo)

#### macOS (Homebrew)
```bash
# Instalar PostgreSQL
brew install postgresql@15

# Iniciar servicio
brew services start postgresql@15

# Crear base de datos
createdb erp

# Tu DATABASE_URL será:
# postgresql://localhost:5432/erp
```

#### Linux (Ubuntu/Debian)
```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crear usuario y base de datos
sudo -u postgres createuser --interactive
sudo -u postgres createdb erp

# Tu DATABASE_URL será:
# postgresql://usuario:password@localhost:5432/erp
```

#### Windows
```bash
# Descarga PostgreSQL desde:
# https://www.postgresql.org/download/windows/

# Después de instalar, crea la base de datos:
# pgAdmin 4 o desde cmd:
createdb -U postgres erp

# Tu DATABASE_URL será:
# postgresql://postgres:password@localhost:5432/erp
```

### Opción 3: PostgreSQL en la Nube (Alternativas)

#### Supabase (Gratis)
1. Ve a https://supabase.com
2. Crea un proyecto
3. Ve a **Settings** → **Database**
4. Copia el **Connection String** (modo Pooler recomendado)

#### Neon (Gratis)
1. Ve a https://neon.tech
2. Crea un proyecto
3. Copia el **Connection String**

#### Railway (Gratis con límites)
1. Ve a https://railway.app
2. Crea un proyecto PostgreSQL
3. Copia el **DATABASE_URL**

## Configuración del Proyecto

### 1. Variables de Entorno

Crea un archivo `.env`:

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@host:5432/database

# O con Deno Deploy:
DATABASE_URL=postgresql://user:password@db.deno.com:5432/database

# JWT & Session
JWT_SECRET=tu-secreto-super-seguro-de-32-caracteres
SESSION_SECRET=otro-secreto-diferente-para-sesiones

# App Config
NODE_ENV=development
APP_NAME=Mi ERP
```

### 2. Aplicar Schema a la Base de Datos

```bash
# Desarrollo: Push directo del schema (rápido)
npm run db:push

# Producción: Generar y ejecutar migraciones
npm run db:generate  # Genera archivos de migración
npm run db:migrate   # Ejecuta migraciones
```

### 3. Explorar la Base de Datos

```bash
# Abrir Drizzle Studio (GUI visual)
npm run db:studio
# Abre http://localhost:4983
```

## Comandos de Drizzle

| Comando | Descripción |
|---------|-------------|
| `npm run db:push` | Aplica schema directamente (desarrollo) |
| `npm run db:generate` | Genera archivos de migración SQL |
| `npm run db:migrate` | Ejecuta migraciones pendientes |
| `npm run db:studio` | Abre GUI para explorar datos |

## Schema de la Base de Datos

El schema está definido en `app/db/schema.ts` con las siguientes tablas:

### Tablas Principales

- **users** - Usuarios del sistema (admin/usuario)
- **members** - Miembros/Clientes
- **classes** - Clases/Actividades
- **instructors** - Instructores
- **schedules** - Horarios de clases
- **membership_types** - Tipos de membresía
- **member_memberships** - Membresías activas de miembros
- **enrollments** - Inscripciones a clases
- **access_logs** - Control de acceso (entradas/salidas)
- **audit_logs** - Auditoría de acciones

### Modificar el Schema

Para agregar o modificar tablas:

1. Edita `app/db/schema.ts`
2. Ejecuta `npm run db:push` (desarrollo) o `npm run db:generate` (producción)

## Conexión desde el Código

```typescript
// Importar DB y schema
import { db } from "~/db";
import { members, classes } from "~/db/schema";

// Ejemplo: Obtener todos los miembros activos
const activeMembers = await db
  .select()
  .from(members)
  .where(eq(members.activo, true));

// Ejemplo: Crear un nuevo miembro
const newMember = await db
  .insert(members)
  .values({
    numeroMiembro: "M001",
    nombre: "Juan",
    apellidos: "Pérez",
    telefono: "1234567890",
  })
  .returning();
```

## Troubleshooting

### Error: "Connection refused"
- Verifica que PostgreSQL esté corriendo
- Verifica que el DATABASE_URL sea correcto
- Verifica que el puerto sea 5432 (default de PostgreSQL)

### Error: "Database does not exist"
```bash
# Crea la base de datos
createdb erp
```

### Error: "Password authentication failed"
- Verifica que el usuario y password en DATABASE_URL sean correctos
- En PostgreSQL local, puede que necesites configurar pg_hba.conf

### Ver logs de PostgreSQL
```bash
# macOS (Homebrew)
tail -f /opt/homebrew/var/log/postgresql@15.log

# Linux
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

## Migraciones en Producción

Para desplegar cambios de schema a producción:

```bash
# 1. Genera migraciones
npm run db:generate

# 2. Revisa los archivos SQL en drizzle/
# 3. Commitea las migraciones al repo
git add drizzle/
git commit -m "Add database migrations"

# 4. En producción, ejecuta:
npm run db:migrate
```

## Backup y Restore

### Backup
```bash
pg_dump -U usuario -d erp > backup.sql
```

### Restore
```bash
psql -U usuario -d erp < backup.sql
```

## Recursos

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Deno Deploy PostgreSQL](https://deno.com/deploy/docs/databases)
