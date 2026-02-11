# Notas de Migración a Deno Deploy

## Cambios Realizados

Este proyecto ha sido adaptado para funcionar con Deno Deploy manteniendo compatibilidad con Node.js.

### Archivos Nuevos

1. **`deno.json`** - Configuración principal de Deno
   - Define imports de paquetes npm
   - Configura tasks (dev, build, start)
   - Opciones del compilador TypeScript

2. **`server.ts`** - Punto de entrada para Deno Deploy
   - Usa `@react-router/deno` en lugar de `@react-router/node`
   - Usa `Deno.serve()` nativo

3. **`deno.deploy.json`** - Configuración de deployment
   - Define el entrypoint y archivos a excluir

4. **`DENO_DEPLOY.md`** - Guía completa de despliegue

### Archivos Modificados

1. **`package.json`**
   - Cambiado `@react-router/node` → `@react-router/deno`
   - Se mantienen todas las demás dependencias

2. **`README.md`**
   - Agregadas instrucciones para Deno
   - Actualizada sección de Stack
   - Nuevas instrucciones de despliegue

3. **`.gitignore`**
   - Agregado `.deno` y `deno.lock`

## Compatibilidad

### ✅ Funciona en Ambos Runtimes

- React Router v7
- Mongoose (via npm:)
- Todas las librerías de UI
- Tailwind CSS
- Autenticación JWT
- Todos los modelos y rutas

### 📦 Uso de npm Packages en Deno

Deno soporta paquetes npm a través de especificadores `npm:`. Esto significa que no necesitamos reescribir código que usa:
- `mongoose`
- `bcryptjs`
- `jsonwebtoken`
- Cualquier otra librería npm

### 🔄 Variables de Entorno

**Node.js:**
```javascript
process.env.MONGODB_URI
```

**Deno:**
```javascript
Deno.env.get("MONGODB_URI")
```

El código actual usa `process.env` que funciona en Deno cuando se usan npm packages que lo requieren.

## Beneficios de Deno Deploy

1. **Deploy más rápido**: Cold starts más rápidos que contenedores
2. **Global edge network**: Tu app se replica en múltiples regiones
3. **TypeScript nativo**: No necesitas compilación adicional
4. **Seguridad**: Permisos explícitos por defecto
5. **Free tier generoso**: 100k requests/día gratis

## Cómo Desarrollar

### Con Deno (Nuevo)

```bash
# Instalar dependencias (automático en primera ejecución)
deno task dev

# Build
deno task build

# Typecheck
deno task typecheck
```

### Con Node.js (Sigue funcionando)

```bash
npm install
npm run dev
npm run build
```

## Despliegue

### Desarrollo Local

```bash
# Con Deno
deno task dev

# Con Node
npm run dev
```

### Producción

**Deno Deploy:**
```bash
deno task build
deployctl deploy --project=mi-erp server.ts
```

**Fly.io/Docker (Node):**
```bash
npm run build
# Usar Dockerfile o fly.toml existentes
```

## Troubleshooting

### "Cannot find module"
Si ves errores de módulos no encontrados:
```bash
# Limpiar caché de Deno
deno cache --reload server.ts

# O reinstalar con npm
npm install
```

### Diferencias de comportamiento
Los paquetes npm en Deno pueden comportarse ligeramente diferente. Si encuentras problemas:
1. Revisa la documentación de Deno sobre npm packages
2. Considera usar alternativas nativas de Deno si existen
3. Reporta el issue en el repositorio

### MongoDB Connection
Mongoose funciona perfectamente en Deno a través de npm:. No hay cambios necesarios en tus modelos.

## Migración Futura

Si en el futuro quieres usar el driver nativo de MongoDB de Deno en lugar de Mongoose:

1. Cambiar imports de `mongoose` a `mongodb` (driver nativo)
2. Reescribir schemas como objetos TypeScript planos
3. Actualizar las queries a sintaxis del driver nativo

Por ahora, mantener Mongoose es la opción más práctica y no afecta el rendimiento significativamente.

## Recursos

- [Deno Deploy Docs](https://deno.com/deploy/docs)
- [Deno npm compatibility](https://deno.land/manual/node/npm_specifiers)
- [React Router with Deno](https://reactrouter.com/start/framework/installation)
