# 🚀 Quick Start

Guía de 5 minutos para empezar con el proyecto.

## Opción 1: Sin Base de Datos (Solo UI)

Si solo quieres ver la interfaz sin configurar PostgreSQL:

```bash
git clone https://github.com/blissito/rr7-erp-template.git
cd rr7-erp-template
npm install

# Comenta la línea de DB en cualquier archivo que la use
# O simplemente explora los componentes en app/components/

npm run dev
```

Abre http://localhost:3000

## Opción 2: Con PostgreSQL Local

### macOS/Linux

```bash
# 1. Clonar
git clone https://github.com/blissito/rr7-erp-template.git
cd rr7-erp-template

# 2. Instalar
npm install

# 3. PostgreSQL (si no lo tienes)
# macOS:
brew install postgresql@15
brew services start postgresql@15
createdb erp

# Linux:
sudo apt install postgresql
sudo -u postgres createdb erp

# 4. Ya tienes .env configurado por defecto
# Solo verifica que DATABASE_URL apunte a tu DB

# 5. Aplicar schema
npm run db:push

# 6. Ejecutar
npm run dev
```

Abre http://localhost:3000

### Windows

```bash
# 1. Instala PostgreSQL desde:
# https://www.postgresql.org/download/windows/

# 2. Crea la base de datos "erp" usando pgAdmin

# 3. Clona el proyecto
git clone https://github.com/blissito/rr7-erp-template.git
cd rr7-erp-template
npm install

# 4. Edita .env con tu usuario/password de PostgreSQL
# DATABASE_URL=postgresql://postgres:tu-password@localhost:5432/erp

# 5. Aplicar schema
npm run db:push

# 6. Ejecutar
npm run dev
```

## Opción 3: Con PostgreSQL en la Nube (Sin instalar nada)

### Usando Supabase (Gratis)

```bash
# 1. Crea cuenta en https://supabase.com
# 2. Crea un proyecto
# 3. Ve a Settings → Database
# 4. Copia el "Connection String" (Pooler mode)

# 5. Clona y configura
git clone https://github.com/blissito/rr7-erp-template.git
cd rr7-erp-template
npm install

# 6. Edita .env
# DATABASE_URL=postgresql://[tu-url-de-supabase]

# 7. Aplicar schema
npm run db:push

# 8. Ejecutar
npm run dev
```

### Usando Neon (Gratis)

```bash
# 1. Crea cuenta en https://neon.tech
# 2. Crea un proyecto
# 3. Copia el "Connection String"
# 4. Sigue pasos 5-8 de Supabase arriba
```

## Verificar que Funciona

Una vez corriendo en http://localhost:3000:

1. ✅ Deberías ver la página de login
2. ✅ Puedes crear un usuario admin
3. ✅ Explorar el dashboard
4. ✅ CRUD de miembros, clases, instructores

## Explorar la Base de Datos

```bash
# Abrir Drizzle Studio (GUI visual)
npm run db:studio
```

Abre http://localhost:4983 y explora tus tablas visualmente.

## Comandos Útiles

```bash
npm run dev              # Servidor desarrollo (puerto 3000)
npm run db:studio        # GUI para ver/editar datos
npm run db:push          # Aplicar cambios de schema
npm run typecheck        # Verificar tipos TypeScript
```

## Siguientes Pasos

1. **Personaliza tu ERP:**
   - Edita `app/config/app.config.ts`
   - Cambia colores en `app/tailwind.css`

2. **Agrega funcionalidad:**
   - Nuevos modelos: `app/db/schema.ts`
   - Nuevas rutas: `app/routes/`
   - Componentes: `app/components/`

3. **Deploy:**
   - Ver [DENO_SETUP.md](./DENO_SETUP.md) para Deno Deploy
   - O usa Fly.io/Railway/Vercel

## ¿Problemas?

### "Connection refused" / Error de DB
```bash
# Verifica que PostgreSQL esté corriendo
# macOS:
brew services list

# Linux:
sudo systemctl status postgresql

# Verifica que la base de datos exista:
psql -l
```

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Puerto 3000 ocupado
```bash
# Cambia el puerto en package.json
"dev": "react-router dev --port 3001"
```

## Documentación Completa

- [README.md](./README.md) - Documentación principal
- [DATABASE.md](./DATABASE.md) - Guía de PostgreSQL
- [DENO_SETUP.md](./DENO_SETUP.md) - Deploy en Deno
- [docs/advanced/](./docs/advanced/) - Temas avanzados

## Stack Tecnológico

- **Frontend:** React 19 + React Router v7
- **Backend:** React Router SSR
- **Database:** PostgreSQL + Drizzle ORM
- **Styling:** Tailwind CSS v4
- **Auth:** JWT + httpOnly cookies
- **Validation:** Zod
- **Deploy:** Deno Deploy / Fly.io / Node.js

---

**¡Listo para desarrollar! 🎉**
