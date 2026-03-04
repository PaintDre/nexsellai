
## Problema
El nombre de la landing muestra "hidro lavadora - AIDA" en el header. El texto "AIDA" es un detalle técnico interno que no debe ser visible al usuario.

## Solución
Remover la concatenación del `mode` del nombre de la landing. El nombre debe ser simplemente el nombre del producto, sin sufijo técnico.

### Cambios necesarios

**`src/pages/GenerateLanding.tsx` (línea 110)**
Cambiar:
```typescript
name: `${product.name} - ${mode.toUpperCase()}`,
```

Por:
```typescript
name: product.name,
```

Esto garantiza que:
- Las landings se crean con el nombre limpio del producto
- No aparece "AIDA" o ningún detalle técnico en la UI
- Las landings existentes ya creadas pueden necesitar renombrarse manualmente en la vista (si lo desea el usuario)

### Archivos a modificar
- `src/pages/GenerateLanding.tsx` - Línea 110: Remover `- ${mode.toUpperCase()}` del nombre
