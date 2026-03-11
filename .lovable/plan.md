

# Plan: Vista Admin de Suscripciones + Mejoras Mobile UI

Este plan combina dos tareas: (1) crear la vista de suscripciones activas en admin, y (2) pulir la experiencia mobile en todas las páginas principales.

## 1. Vista Admin Suscripciones

### Backend: Nuevo endpoint GET /subscriptions en admin-api

Agregar al edge function `admin-api/index.ts` un endpoint que consulte `subscriptions` con join a `profiles`, obtenga emails via `auth.admin.getUserById`, y devuelva la lista ordenada por `created_at desc`.

### Frontend: Nueva página AdminSubscriptions.tsx

- Tabla en desktop con columnas: Usuario, Plan, Estado, Inicio, Expiración, Payment ID
- Cards en mobile con la misma info condensada
- Badge de color por estado (active=green, expired=amber, cancelled=red)
- Botón de volver a /admin

### Routing

- Agregar ruta `/admin/subscriptions` en `App.tsx` bajo `AdminLayout`
- Agregar lazy import de `AdminSubscriptions`
- Agregar botón "Suscripciones" en `AdminDashboard.tsx`
- Agregar link en `AppSidebar.tsx` (admin items)

## 2. Mejoras Mobile UI

Revisión de todas las páginas principales para viewport 390px:

### AppLayout.tsx (header mobile)
- Agregar badge del plan y nombre del usuario en el header mobile (como existe en desktop)
- Reducir padding para más espacio

### Pricing.tsx
- Hacer que las cards de planes se apilen correctamente en mobile (ya lo hacen con grid-cols-1)
- El selector de país y billing tabs se alinean en columna en mobile, verificar que no se desborde
- Reducir padding del country selector para que quepa mejor

### Dashboard.tsx
- Las stat cards grid-cols-2 en mobile cortan texto en pantallas de 320px. Ajustar font-size del valor numérico
- Las landing cards: los badges + botón "Ver" se apilan mejor en mobile

### Landings.tsx
- Los botones de acción (Editor, Preview, Duplicar, Exportar, Eliminar) son 5 en un espacio reducido. Reorganizar en 2 filas claras
- Mejorar spacing en cards mobile

### Banners.tsx
- Los filtros (plantilla, tamaño, ordenar, seleccionar) se desbordan en mobile. Hacer que ocupen full width
- El header "Generar Banners" botón a full width en mobile

### AdminDashboard.tsx
- Los 3 botones (Usuarios, Pagos, Configuración) ya tienen `flex-1 sm:flex-none` pero pueden mejorar con stack vertical en mobile
- Stat cards: `grid-cols-2` en mobile en vez de 1 columna para mejor uso del espacio

### AdminPayments.tsx
- Ya tiene mobile cards, OK. Ajustar spacing

### ProductForm / GenerateLanding / GenerateBanner
- Estos formularios ya usan `mx-auto` con max-width, verificar que los touch targets sean 44px min

### General
- Asegurar que todos los botones de acción tengan `min-h-[44px]` para touch targets
- Verificar que los Select triggers tengan altura suficiente en mobile

## Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `src/pages/AdminSubscriptions.tsx` | **Nuevo** — página de suscripciones admin |
| `supabase/functions/admin-api/index.ts` | Agregar GET /subscriptions |
| `src/App.tsx` | Agregar ruta + lazy import |
| `src/pages/AdminDashboard.tsx` | Botón de navegación a suscripciones |
| `src/components/AppSidebar.tsx` | Link admin "Suscripciones" |
| `src/components/AppLayout.tsx` | Mejorar header mobile (badge plan + nombre) |
| `src/pages/Dashboard.tsx` | Ajustes mobile en stat cards y landing cards |
| `src/pages/Pricing.tsx` | Ajustes mobile en selectors |
| `src/pages/Landings.tsx` | Reorganizar botones de acción en mobile |
| `src/pages/Banners.tsx` | Filtros full-width en mobile |

