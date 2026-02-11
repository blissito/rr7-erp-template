# Setup para Deno Deploy

Guía completa para desplegar tu ERP en Deno Deploy con PostgreSQL.

## ¿Por qué Deno + Drizzle + PostgreSQL?

- ✅ **Drizzle funciona perfecto en Deno** - Type-safe, ligero, rápido
- ✅ **PostgreSQL gratis en Deno Deploy** - Sin configuración adicional
- ✅ **Edge deployment** - Tu app en múltiples regiones globalmente
- ✅ **Cold starts ultra-rápidos** - ~200ms vs 2-3s
- ✅ **Free tier generoso** - 100k requests/día

## Paso 1: Desarrollo Local

### Con Node.js (Desarrollo rápido)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar PostgreSQL local
# Ver DATABASE.md para opciones

# 3. Configurar .env
cp .env.example .env
# Editar DATABASE_URL

# 4. Aplicar schema
npm run db:push

# 5. Ejecutar
npm run dev
```

Abre http://localhost:3000

### Con Deno (Testing para producción)

```bash
# 1. Instalar Deno
curl -fsSL https://deno.land/install.sh | sh

# 2. Configurar .env igual que arriba

# 3. Ejecutar con Deno
deno task dev
```

## Paso 2: Deploy en Deno Deploy

### A. Crear Proyecto

1. Ve a https://dash.deno.com
2. Click **New Project**
3. Conecta tu repositorio de GitHub (recomendado) o deploy manual

### B. Habilitar PostgreSQL

1. En tu proyecto, ve a **Settings**
2. Click en **Databases**
3. Habilita **PostgreSQL**
4. Deno Deploy te dará un `DATABASE_URL` automáticamente

### C. Configurar Variables de Entorno

En **Settings** → **Environment Variables**, agrega:

```
DATABASE_URL=postgresql://[auto-generado-por-deno]
JWT_SECRET=tu-secreto-super-seguro-de-32-caracteres
SESSION_SECRET=otro-secreto-diferente-para-sesiones
APP_NAME=Mi ERP
NODE_ENV=production
```

### D. Deploy

#### Opción 1: Deploy desde GitHub (Recomendado)

1. En tu proyecto de Deno Deploy
2. **Settings** → **Git Integration**
3. Conecta tu repo
4. Branch: `main`
5. Entrypoint: `server.ts`
6. Cada push desplegará automáticamente

#### Opción 2: Deploy Manual

```bash
# Instalar deployctl
deno install -A --no-check -r -f https://deno.land/x/deploy/deployctl.ts

# Login
deployctl login

# Build (si usaste npm)
npm run build

# Deploy
deployctl deploy --project=mi-erp server.ts
```

## Paso 3: Aplicar Schema a PostgreSQL de Producción

Después del primer deploy:

```bash
# Usando el DATABASE_URL de producción
DATABASE_URL="postgresql://[url-de-deno-deploy]" npm run db:push
```

O desde Drizzle Studio:

```bash
DATABASE_URL="postgresql://[url-de-deno-deploy]" npm run db:studio
```

## Estructura del Proyecto

```
├── app/
│   ├── db/
│   │   ├── schema.ts      # Schema de Drizzle (tablas)
│   │   └── index.ts       # Cliente de DB
│   ├── routes/            # Rutas de React Router
│   └── components/        # Componentes UI
├── server.ts              # Servidor para Deno Deploy
├── deno.json              # Config de Deno
├── drizzle.config.ts      # Config de Drizzle
└── package.json           # Compatible con npm también
```

## Comandos Útiles

### Desarrollo

```bash
npm run dev              # Servidor de desarrollo (puerto 3000)
npm run db:studio        # GUI para explorar DB
npm run db:push          # Aplicar cambios de schema
```

### Deno

```bash
deno task dev            # Desarrollo con Deno
deno task build          # Build
deno task verify         # Verificar configuración
```

### Base de Datos

```bash
npm run db:generate      # Generar migraciones
npm run db:migrate       # Ejecutar migraciones
npm run db:push          # Push directo (desarrollo)
npm run db:studio        # Abrir Drizzle Studio
```

## Migraciones en Producción

Para cambios de schema en producción:

```bash
# 1. Generar migración
npm run db:generate

# 2. Commit al repo
git add drizzle/
git commit -m "Add new columns"
git push

# 3. Ejecutar en producción
DATABASE_URL="[prod-url]" npm run db:migrate
```

## Monitoreo

Una vez desplegado:

- **Logs**: https://dash.deno.com/projects/[tu-proyecto]/logs
- **Analytics**: https://dash.deno.com/projects/[tu-proyecto]/analytics
- **Database**: https://dash.deno.com/projects/[tu-proyecto]/databases

## Troubleshooting

### Error: "Cannot find module"
```bash
# Limpiar caché
deno cache --reload server.ts
npm run build
```

### Error de conexión a PostgreSQL
- Verifica que PostgreSQL esté habilitado en Deno Deploy
- Verifica que `DATABASE_URL` esté en las variables de entorno
- Verifica que el schema esté aplicado: `npm run db:push`

### Build falla
```bash
# Verificar tipos
npm run typecheck

# Limpiar y rebuilder
rm -rf build node_modules
npm install
npm run build
```

## Diferencias Drizzle vs Mongoose

### Mongoose (Antes)
```typescript
const member = await Member.findOne({ email });
```

### Drizzle (Ahora)
```typescript
import { db } from "~/db";
import { members } from "~/db/schema";
import { eq } from "drizzle-orm";

const [member] = await db
  .select()
  .from(members)
  .where(eq(members.email, email));
```

**Ventajas de Drizzle:**
- ✅ Type-safety completo
- ✅ Más rápido
- ✅ Queries SQL visibles
- ✅ Funciona en Deno sin problemas
- ✅ Menor tamaño de bundle

## Costos

### Free Tier (Suficiente para mayoría)
- 100,000 requests/día
- 100 GB-hours CPU/mes
- PostgreSQL incluido (1 GB storage)

### Pro ($20/mes)
- 5M requests/día
- PostgreSQL 10 GB storage
- Soporte prioritario

## Recursos

- [Deno Deploy Docs](https://deno.com/deploy/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [DATABASE.md](./DATABASE.md) - Guía de PostgreSQL
- [React Router Docs](https://reactrouter.com)

## Próximos Pasos

1. ✅ Setup local con PostgreSQL
2. ✅ Desarrollar y probar localmente
3. ✅ Crear proyecto en Deno Deploy
4. ✅ Habilitar PostgreSQL
5. ✅ Configurar variables de entorno
6. ✅ Deploy desde GitHub o manual
7. ✅ Aplicar schema a DB de producción
8. 🚀 Tu ERP está en producción!

URL: `https://[tu-proyecto].deno.dev`
