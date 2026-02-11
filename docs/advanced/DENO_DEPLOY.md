# Guía de Despliegue en Deno Deploy

Este proyecto está configurado para desplegarse fácilmente en Deno Deploy.

## Prerrequisitos

1. **Instalar Deno:**
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Cuenta en Deno Deploy:**
   - Crea una cuenta en https://dash.deno.com
   - Puedes usar tu cuenta de GitHub

## Configuración del Proyecto

El proyecto ya incluye:
- `deno.json` - Configuración de Deno con imports y tasks
- `server.ts` - Punto de entrada para Deno Deploy
- `deno.deploy.json` - Configuración de deployment

## Despliegue Paso a Paso

### 1. Build del Proyecto

```bash
deno task build
```

Esto generará el directorio `build/` con la aplicación compilada.

### 2. Instalar deployctl

```bash
deno install -A --no-check -r -f https://deno.land/x/deploy/deployctl.ts
```

### 3. Autenticarse

```bash
deployctl login
```

Esto abrirá tu navegador para autenticarte con GitHub.

### 4. Desplegar

**Opción A: Crear nuevo proyecto interactivamente**
```bash
deployctl deploy server.ts
```

**Opción B: Especificar nombre de proyecto**
```bash
deployctl deploy --project=mi-erp server.ts
```

## Variables de Entorno

Después del despliegue, configura las variables de entorno en el dashboard:

1. Ve a https://dash.deno.com
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

```
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database
JWT_SECRET=tu-secreto-jwt-super-seguro
SESSION_SECRET=tu-secreto-session-super-seguro
APP_NAME=Mi ERP
APP_DESCRIPTION=Sistema de gestión empresarial
NODE_ENV=production
```

## Despliegue Automático desde GitHub

Para configurar despliegues automáticos:

1. En el dashboard de Deno Deploy, ve a tu proyecto
2. Ve a **Settings** → **Git Integration**
3. Conecta tu repositorio de GitHub
4. Configura la rama (ej: `main` o `production`)
5. Especifica el entrypoint: `server.ts`
6. Cada push a la rama configurada desplegará automáticamente

## Desarrollo Local

### Usando Deno

```bash
# Desarrollo con hot reload
deno task dev

# Build
deno task build

# Ejecutar servidor localmente
deno run --allow-net --allow-read --allow-env server.ts
```

### Usando npm (compatible)

El proyecto sigue siendo compatible con npm/Node.js:

```bash
npm install
npm run dev
```

## Diferencias con Node.js

Este proyecto usa **npm packages en Deno** a través de especificadores `npm:`. Esto significa:

- ✅ Puedes usar Mongoose, React Router, y otras librerías de npm
- ✅ No necesitas reescribir el código existente
- ✅ Compatible con ambos runtimes (Node.js y Deno)
- ⚡ Rendimiento mejorado con Deno Deploy

## Monitoreo y Logs

Una vez desplegado:

1. **Logs en tiempo real:**
   - Dashboard → Tu proyecto → Logs

2. **Analytics:**
   - Dashboard → Tu proyecto → Analytics

3. **Dominios personalizados:**
   - Dashboard → Tu proyecto → Settings → Domains

## Troubleshooting

### Error: "Module not found"
- Asegúrate de que todos los imports estén en `deno.json`
- Ejecuta `deno cache --reload server.ts`

### Error de conexión a MongoDB
- Verifica que `MONGODB_URI` esté configurado en las variables de entorno
- Asegúrate de que tu IP esté en la whitelist de MongoDB Atlas

### Build fails
- Ejecuta `deno task typecheck` para ver errores de TypeScript
- Verifica que todas las dependencias estén actualizadas

## Recursos

- [Documentación de Deno Deploy](https://deno.com/deploy/docs)
- [React Router v7 Docs](https://reactrouter.com/docs)
- [Deno Manual](https://deno.land/manual)

## Costos

Deno Deploy ofrece:
- **Free tier:** 100,000 requests/día, 100 GiB bandwidth/mes
- **Pro tier:** $20/mes con límites mucho más altos

Para la mayoría de ERPs pequeños a medianos, el free tier es suficiente.
