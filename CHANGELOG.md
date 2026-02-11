# Changelog

## [1.1.0] - 2026-02-11

### 🚀 Added - Configuración Opcional para Deno Deploy

#### Archivos de Configuración
- **`deno.json`** - Configuración completa de Deno con imports npm, tasks y compiler options
- **`server.ts`** - Servidor usando `@react-router/deno` y `Deno.serve()`
- **`deno.deploy.json`** - Configuración de deployment
- **`verify-deno.ts`** - Script de verificación pre-deploy

#### Documentación
- **`DENO_DEPLOY.md`** - Guía completa de despliegue en Deno Deploy
- **`MIGRATION_NOTES.md`** - Notas detalladas de migración y compatibilidad
- **`CHANGELOG.md`** - Este archivo

#### CI/CD
- **`.github/workflows/deploy.yml`** - GitHub Actions para deploy automático

#### Tasks de Deno
```bash
deno task dev      # Desarrollo
deno task build    # Build de producción
deno task verify   # Verificar configuración
deno task deploy   # Build y deploy
```

### 🔄 Changed - Adaptaciones

#### package.json
- `@react-router/node` → `@react-router/deno`
- Se mantiene compatibilidad con npm/Node.js

#### README.md
- Agregadas instrucciones para Deno
- Sección de Stack actualizada
- Nuevas instrucciones de despliegue
- Scripts duales (Deno y npm)

#### .gitignore
- Agregado `.deno` y `deno.lock`

### ✅ Maintained - Compatibilidad

#### Sin Cambios en la Aplicación
- ✓ Todos los modelos de Mongoose funcionan igual
- ✓ Todas las rutas de React Router sin cambios
- ✓ Componentes UI idénticos
- ✓ Lógica de negocio intacta
- ✓ Sistema de autenticación sin modificar

#### Runtime Dual
El proyecto ahora soporta ambos runtimes:

**Deno:**
```bash
deno task dev
deno task build
```

**Node.js:**
```bash
npm install
npm run dev
npm run build
```

### 📦 Dependencies

#### Mantenidas (via npm:)
- `mongoose@^8.9.5` - ORM para MongoDB
- `react@^19.0.0` - UI library
- `react-router@^7.1.3` - Framework
- `bcryptjs`, `jsonwebtoken`, `zod` - Utils de seguridad

#### Nueva
- `@react-router/deno@^7.1.3` - Adapter para Deno

#### Removida
- `@react-router/node@^7.1.3` - Reemplazado por adapter Deno

### 🎯 Migration Benefits

1. **Mejor Performance**
   - Cold starts más rápidos
   - Edge deployment global
   - Optimizaciones del runtime Deno

2. **Developer Experience**
   - TypeScript nativo sin config extra
   - Formatter y linter incluidos
   - Mejor manejo de imports

3. **Deployment**
   - Deploy directo sin Docker
   - Free tier generoso (100k requests/día)
   - Zero-config SSL y CDN

4. **Seguridad**
   - Permisos explícitos
   - Secure by default
   - Runtime moderno

### 🔧 Breaking Changes

#### Para Usuarios Actuales
Si ya tienes este proyecto corriendo:

1. **Pull los cambios**
2. **Instala Deno** (si vas a usar Deno)
3. **Actualiza dependencias:**
   ```bash
   # Con Node (sigue funcionando)
   npm install

   # Con Deno (nuevo)
   deno task dev  # auto-instala
   ```
4. **Para deploy en Deno:**
   - Sigue `DENO_DEPLOY.md`

#### No Breaking para:
- ✓ Usuarios de Node.js pueden seguir usándolo
- ✓ Código de aplicación sin cambios
- ✓ Base de datos sin cambios
- ✓ Variables de entorno igual

### 📚 Documentation Updates

Nuevos recursos:
- Guía paso a paso en `DENO_DEPLOY.md`
- Notas de migración en `MIGRATION_NOTES.md`
- README actualizado con instrucciones duales
- Script de verificación con `deno task verify`

### 🐛 Known Issues

#### Compatible pero Sub-óptimo
- **Mongoose**: Funciona pero se usa via npm:. En el futuro se podría migrar al driver nativo de MongoDB para mejor performance

#### Workarounds
Ninguno necesario - todo funciona out of the box.

### 🔮 Future Considerations

Posibles mejoras futuras (opcionales):
1. Migrar de Mongoose a driver nativo de MongoDB
2. Usar imports de Deno estándar en vez de npm: donde existan alternativas
3. Aprovechar más features nativos de Deno (KV, Cron, etc)

Por ahora, la solución actual es óptima: mantiene compatibilidad mientras permite deployment en Deno.

---

## Migración Completa

El proyecto ahora es **Deno-first** pero mantiene total compatibilidad con Node.js.

**Desarrolladores nuevos:** Usa Deno
**Usuarios existentes:** Sigue con Node o migra cuando quieras
**Deploy:** Deno Deploy recomendado, pero Fly.io/Docker siguen funcionando
