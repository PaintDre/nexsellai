

# Plan: Sistema de Limites de Generacion de Banners por Plan

## Resumen

Agregar columnas `banners_used` y `banners_reset_at` a la tabla `profiles`, implementar validacion en el edge function y en el frontend, y mostrar el uso en el dashboard.

## Cambios

### 1. Migracion de base de datos

Agregar a la tabla `profiles`:
- `banners_used INTEGER NOT NULL DEFAULT 0`
- `banners_reset_at TIMESTAMPTZ`

### 2. Edge Function `generate-banner/index.ts`

Antes de generar, validar:
- Obtener el perfil del usuario (plan, banners_used, banners_reset_at)
- Si `banners_reset_at` es NULL o tiene mas de 30 dias, resetear `banners_used = 0` y actualizar `banners_reset_at = now()`
- Verificar que `banners_used + cantidad_a_generar <= limite_del_plan`
- Limites: `{ free: 2, starter: 30, pro: 150 }`
- Si excede, retornar error con mensaje descriptivo
- Despues de generar exitosamente, incrementar `banners_used` con la cantidad generada

### 3. Frontend `GenerateBanner.tsx`

- Consultar `banners_used` y `banners_reset_at` del perfil al cargar
- Calcular banners restantes segun plan (con logica de reset mensual)
- Mostrar indicador de uso en el step 4 (antes del boton generar): "X / Y banners usados este mes"
- Si el limite se alcanza, deshabilitar boton y mostrar mensaje con link a /pricing
- Permitir plan Free generar banners (cambiar la validacion actual que solo permite Starter/Pro)

### 4. Dashboard `Dashboard.tsx`

- Agregar una card de estadisticas "Banners Usados" junto a "Landings Usadas"
- Misma estructura: numero usado / limite, barra de progreso
- Limites: `{ free: 2, starter: 30, pro: 150 }`

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `profiles` table (migracion) | Agregar `banners_used`, `banners_reset_at` |
| `supabase/functions/generate-banner/index.ts` | Validacion de limites server-side |
| `src/pages/GenerateBanner.tsx` | UI de uso, bloqueo al alcanzar limite, permitir Free |
| `src/pages/Dashboard.tsx` | Card de banners usados con progress bar |

