# 🚀 Quick Start - Deno Deploy

Guía rápida de 5 minutos para desplegar tu ERP en Deno Deploy.

## ⚡ TL;DR

```bash
# 1. Instalar Deno
curl -fsSL https://deno.land/install.sh | sh

# 2. Configurar .env
cp .env.example .env
# Edita .env con tus valores

# 3. Desarrollo local
deno task dev

# 4. Verificar antes de deploy
deno task verify

# 5. Build y deploy
deno task build
deployctl deploy --project=mi-erp server.ts
```

## 📋 Paso a Paso Detallado

### 1️⃣ Instalar Deno

#### macOS / Linux
```bash
curl -fsSL https://deno.land/install.sh | sh
```

#### Windows (PowerShell)
```powershell
irm https://deno.land/install.ps1 | iex
```

Verifica instalación:
```bash
deno --version
```

### 2️⃣ Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/erp
JWT_SECRET=mi-secreto-super-seguro-de-32-caracteres
SESSION_SECRET=otro-secreto-diferente-para-sesiones
APP_NAME=Mi ERP Empresarial
```

> 💡 Para MongoDB, usa [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier disponible)

### 3️⃣ Desarrollo Local

```bash
# Inicia el servidor de desarrollo
deno task dev
```

Abre http://localhost:5173

**Comandos útiles:**
```bash
deno task build      # Build de producción
deno task typecheck  # Verificar tipos
deno task verify     # Verificar config para deploy
```

### 4️⃣ Preparar para Deploy

#### a) Crear cuenta en Deno Deploy
1. Ve a https://dash.deno.com
2. Sign in con GitHub
3. Gratis: 100,000 requests/día

#### b) Instalar deployctl
```bash
deno install -A --no-check -r -f https://deno.land/x/deploy/deployctl.ts
```

#### c) Autenticarse
```bash
deployctl login
```

#### d) Verificar que todo esté listo
```bash
deno task verify
```

### 5️⃣ Deploy

#### Primera vez (interactivo)
```bash
# Build
deno task build

# Deploy - te preguntará el nombre del proyecto
deployctl deploy server.ts
```

#### Deploys subsecuentes
```bash
# Con nombre de proyecto
deno task build
deployctl deploy --project=mi-erp server.ts

# O usar el task combinado
DENO_PROJECT=mi-erp deno task deploy
```

### 6️⃣ Configurar Variables en Producción

Después del primer deploy:

1. Ve a https://dash.deno.com
2. Selecciona tu proyecto
3. **Settings** → **Environment Variables**
4. Agrega todas las variables de tu `.env`:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `APP_NAME`
   - `NODE_ENV=production`

### 7️⃣ Deploy Automático (Opcional)

Para deploy automático en cada push:

1. En el dashboard de Deno Deploy
2. **Settings** → **Git Integration**
3. Conecta tu repo de GitHub
4. Rama: `main`
5. Entrypoint: `server.ts`

Listo! Cada push desplegará automáticamente.

## 🎯 Verificación Post-Deploy

```bash
# Ver logs en tiempo real
deployctl logs --project=mi-erp

# O en el dashboard
# https://dash.deno.com/projects/mi-erp/logs
```

Tu app estará en:
```
https://mi-erp.deno.dev
```

## 🆘 Troubleshooting

### Error: Cannot find module
```bash
# Limpia la caché de Deno
deno cache --reload server.ts
deno task dev
```

### Error: MongoDB connection
- Verifica que `MONGODB_URI` esté en las variables de entorno de Deno Deploy
- Asegúrate de que tu IP esté en la whitelist de MongoDB Atlas (usa `0.0.0.0/0` para permitir todas)

### Build falla
```bash
# Verifica tipos
deno task typecheck

# Intenta limpiar y rebuilder
rm -rf build .deno node_modules
deno task build
```

### Deploy muy lento o falla
```bash
# Asegúrate de que el build existe
ls -la build/

# Si no existe, build primero
deno task build

# Luego deploy
deployctl deploy --project=mi-erp server.ts
```

## 📊 Monitoreo

Una vez desplegado:

- **Logs**: https://dash.deno.com/projects/mi-erp/logs
- **Analytics**: https://dash.deno.com/projects/mi-erp/analytics
- **Settings**: https://dash.deno.com/projects/mi-erp/settings

## 🔐 Seguridad

Checklist antes de producción:

- [ ] Variables de entorno configuradas en Deno Deploy
- [ ] `JWT_SECRET` es único y seguro (32+ caracteres)
- [ ] `SESSION_SECRET` es único y diferente de JWT_SECRET
- [ ] `NODE_ENV=production` en variables de entorno
- [ ] MongoDB tiene usuario/contraseña fuertes
- [ ] IP whitelist configurada en MongoDB

## 💰 Costos

**Free Tier** (suficiente para mayoría de ERPs):
- 100,000 requests/día
- 100 GiB bandwidth/mes
- 100 GB-hours de CPU/mes

**Pro** ($20/mes):
- 5M requests/día
- 1 TB bandwidth/mes
- Soporte prioritario

## 📚 Más Información

- [DENO_DEPLOY.md](./DENO_DEPLOY.md) - Guía completa
- [MIGRATION_NOTES.md](./MIGRATION_NOTES.md) - Detalles técnicos
- [README.md](./README.md) - Documentación general

## 🎉 Listo!

Tu ERP está ahora en producción con:
- ✅ Deploy global
- ✅ SSL automático
- ✅ CDN incluido
- ✅ Zero downtime deployments
- ✅ Edge computing

**URL de tu app:** https://mi-erp.deno.dev

---

**¿Problemas?** Abre un issue en GitHub o consulta [DENO_DEPLOY.md](./DENO_DEPLOY.md)
