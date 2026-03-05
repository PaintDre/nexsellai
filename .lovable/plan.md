

# Plan: Revisión y Limpieza del Código

Después de revisar todos los archivos del proyecto, encontré los siguientes problemas a corregir:

## Problemas Encontrados

### 1. Login y Register usan icono `Zap` en vez del logo
En `Login.tsx` (linea 52-53) y `Register.tsx` (linea 45-46), el header muestra un icono `Zap` genérico en vez del logo `logo-ns.png` que ya usamos en el sidebar y la landing.

### 2. Import innecesario de `Zap` en `AppLayout.tsx`
Linea 7: se importa `Zap` pero no se usa en ninguna parte del componente (se reemplazó por el logo en un cambio anterior).

### 3. Import innecesario de `Zap` en `AppSidebar.tsx`
Linea 3: `Zap` se importa pero no se usa en el componente.

### 4. NotFound page en inglés
`NotFound.tsx` tiene textos en inglés ("Oops! Page not found", "Return to Home") mientras todo el sistema está en español.

### 5. PublicLanding no accede a productos por RLS
En `PublicLanding.tsx` linea 34-38, intenta hacer `select("*")` de la tabla `products` para obtener la imagen del producto. Pero `products` tiene RLS que solo permite al dueño ver sus productos. Un visitante anónimo no podrá cargar la imagen del producto.

### 6. Enlace roto en Settings
`SettingsPage.tsx` linea 245: enlace `/#shopify-tutorial` apunta a una sección que no existe. Linea 251: enlace `/docs` apunta a una ruta que no existe (da 404).

## Cambios Propuestos

| Archivo | Cambio |
|---------|--------|
| `src/pages/Login.tsx` | Reemplazar icono `Zap` por `<img src="/logo-ns.png">` |
| `src/pages/Register.tsx` | Reemplazar icono `Zap` por `<img src="/logo-ns.png">` |
| `src/components/AppLayout.tsx` | Remover import de `Zap` no utilizado |
| `src/components/AppSidebar.tsx` | Remover import de `Zap` no utilizado |
| `src/pages/NotFound.tsx` | Traducir textos al español |
| `src/pages/SettingsPage.tsx` | Eliminar enlaces rotos (shopify-tutorial, /docs) |

### No se necesitan cambios en base de datos

El tema de RLS en `products` para PublicLanding es un problema real pero requiere una migración de DB (crear una policy SELECT publica limitada o un approach diferente). Lo dejamos como nota para un siguiente paso para no arriesgar la estabilidad actual.

