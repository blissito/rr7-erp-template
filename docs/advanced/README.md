# Documentación Avanzada

Este directorio contiene documentación para características avanzadas y opcionales del proyecto.

## Deno Deploy (Opcional)

Si quieres explorar deployment en edge computing con Deno Deploy:

1. **[QUICKSTART_DENO.md](./QUICKSTART_DENO.md)** - Guía rápida de 5 minutos
2. **[DENO_DEPLOY.md](./DENO_DEPLOY.md)** - Guía completa paso a paso
3. **[MIGRATION_NOTES.md](./MIGRATION_NOTES.md)** - Detalles técnicos

## ¿Por qué Deno Deploy?

- ⚡ Cold starts ultra-rápidos (~200ms)
- 🌍 Edge deployment global
- 💰 Free tier generoso (100k requests/día)
- 🔒 SSL automático

## ¿Necesito usar Deno?

**No.** El proyecto funciona perfectamente con npm/Node.js tradicional:

```bash
npm install
npm run dev
```

La configuración de Deno es **completamente opcional** y solo está disponible si quieres experimentar con deployment en edge.

## Archivos de Configuración

Si decides usar Deno, estos archivos ya están configurados:
- `deno.json` - Configuración de Deno
- `server.ts` - Servidor para Deno Deploy
- `verify-deno.ts` - Script de verificación

Puedes ignorarlos si usas npm/Node.js.
