

# Plan: Límites Dinámicos, Vista de Pagos Admin y Upgrade Prompts Suaves

## Tarea 1: Migrar límites de planes a system_config

**Problema**: Los límites están hardcoded en `src/lib/constants.ts`. El SuperAdminConfig ya guarda `plan_limits` en `system_config` pero nadie los lee.

**Solución**: Crear un hook `usePlanLimits()` que lea `system_config.plan_limits` (con fallback a los valores hardcoded). Reemplazar todas las referencias a `LANDING_LIMITS` y `BANNER_LIMITS` en 4 archivos.

Archivos afectados:
- **Nuevo**: `src/hooks/usePlanLimits.ts` — hook que fetcha `plan_limits` de `system_config` via admin-api o directamente (necesita RLS policy para lectura pública de la key `plan_limits`)
- **Editar**: `src/pages/Dashboard.tsx` — usar hook en vez de constants
- **Editar**: `src/pages/GenerateBanner.tsx` — usar hook
- **Editar**: `src/pages/GenerateLanding.tsx` — usar hook
- **Editar**: `src/pages/SettingsPage.tsx` — usar hook
- **Migración**: Insertar valores iniciales en `system_config` con key `plan_limits` y key `banner_limits`
- **Editar**: `SuperAdminConfig.tsx` — separar landing limits y banner limits en la UI (actualmente solo guarda `plan_limits` para landings)

Nota: Se necesita una RLS policy que permita a usuarios autenticados leer `system_config` donde `key IN ('plan_limits', 'banner_limits')`, o exponer un endpoint público en admin-api.

**Approach**: Crear una edge function ligera o agregar un endpoint GET `/config/public` en admin-api que devuelva solo los límites sin requerir rol admin. Alternativamente, agregar una RLS policy SELECT para authenticated en system_config filtrada por key.

## Tarea 2: Vista de pagos en el panel de administración

**Backend**: Agregar endpoint `GET /payments` en `admin-api/index.ts` que haga join de `payments` con `profiles` para obtener nombre del usuario.

**Frontend**: Crear `src/pages/AdminPayments.tsx` con:
- Tabla con columnas: Usuario, Plan, Monto, Período, Estado, ID MP, Fecha
- Badge de color según estado (approved=verde, pending=amarillo, rejected=rojo)
- Formato de moneda según el monto

**Routing**: Agregar ruta `/admin/payments` en `App.tsx` dentro de `AdminLayout`.

**Nav**: Agregar link "Pagos" en el sidebar admin y botón en `AdminDashboard.tsx`.

Archivos:
- **Editar**: `supabase/functions/admin-api/index.ts` — nuevo endpoint GET /payments
- **Nuevo**: `src/pages/AdminPayments.tsx`
- **Editar**: `src/App.tsx` — nueva ruta
- **Editar**: `src/components/AppSidebar.tsx` — link admin pagos
- **Editar**: `src/pages/AdminDashboard.tsx` — botón acceso rápido

## Tarea 3: Upgrade prompts suaves

**Componentes nuevos**:
- `src/components/UpgradeWarningBanner.tsx` — banner amarillo sutil que aparece cuando uso >= 80% del límite. Texto: "Estás cerca de tu límite de [recurso]. Actualiza tu plan para seguir creando."
- `src/components/UpgradeModal.tsx` — modal elegante que aparece al 100%. Texto motivacional + botón "Ver planes" que navega a `/pricing`. NO bloquea, permite cerrar.

**Integración**:
- `GenerateBanner.tsx`: mostrar `UpgradeWarningBanner` cuando `bannersUsed / bannerLimit >= 0.8`. Mostrar `UpgradeModal` cuando `bannersUsed >= bannerLimit`.
- `GenerateLanding.tsx`: mismo patrón con landings.
- `Dashboard.tsx`: mostrar `UpgradeWarningBanner` cuando cualquier recurso está al 80%.

Archivos:
- **Nuevo**: `src/components/UpgradeWarningBanner.tsx`
- **Nuevo**: `src/components/UpgradeModal.tsx`
- **Editar**: `src/pages/GenerateBanner.tsx`
- **Editar**: `src/pages/GenerateLanding.tsx`
- **Editar**: `src/pages/Dashboard.tsx`

## Resumen de archivos

| Archivo | Acción |
|---|---|
| `src/hooks/usePlanLimits.ts` | Nuevo — hook para leer límites dinámicos |
| `src/pages/AdminPayments.tsx` | Nuevo — vista de pagos admin |
| `src/components/UpgradeWarningBanner.tsx` | Nuevo — banner advertencia 80% |
| `src/components/UpgradeModal.tsx` | Nuevo — modal upgrade 100% |
| `supabase/functions/admin-api/index.ts` | Editar — endpoints /payments y /config/limits |
| `src/App.tsx` | Editar — ruta /admin/payments |
| `src/components/AppSidebar.tsx` | Editar — link pagos en sidebar |
| `src/pages/AdminDashboard.tsx` | Editar — botón pagos |
| `src/pages/SuperAdminConfig.tsx` | Editar — separar landing/banner limits |
| `src/pages/Dashboard.tsx` | Editar — usar hook + upgrade prompts |
| `src/pages/GenerateBanner.tsx` | Editar — usar hook + upgrade prompts |
| `src/pages/GenerateLanding.tsx` | Editar — usar hook + upgrade prompts |
| `src/pages/SettingsPage.tsx` | Editar — usar hook |
| Migración BD | RLS policy para lectura pública de plan_limits |

