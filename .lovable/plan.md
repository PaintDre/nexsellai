

# Plan: Indicadores de banners en Settings, Admin y Pricing

## Cambios

### 1. Settings — Agregar banners usados en "Plan y uso"

**`src/pages/SettingsPage.tsx`**
- Agregar constante `BANNER_LIMITS = { free: 2, starter: 30, pro: 150 }`
- Calcular `bannersUsed` y `bannerLimit` desde el perfil
- Agregar logica de reset mensual (si `banners_reset_at` > 30 dias, mostrar 0)
- Agregar import `Image` de lucide-react
- En la seccion "Plan y uso", debajo del progress de landings, agregar segunda barra de progreso para "Banners usados" con formato `X / Y`
- Actualizar `CardDescription` para mencionar "landings y banners"

### 2. Admin Dashboard — Agregar estadisticas de banners

**`src/pages/AdminDashboard.tsx`**
- Agregar `totalBanners` y `banners_used` a la interfaz `Stats`
- Agregar import `Image` de lucide-react
- Agregar card "Total Banners Generados" al grid (cambiar a `md:grid-cols-4`)
- Agregar columna "Banners" a la tabla de usuarios mas activos

### 3. Admin API — Retornar datos de banners

**`supabase/functions/admin-api/index.ts`**
- En `/stats`: agregar query `count` a tabla `banners` para `totalBanners`
- Agregar `banners_used` al select de `topUsers`
- Incluir `totalBanners` en la respuesta

### 4. Pricing — Mostrar limites de banners en cada plan

**`src/pages/Pricing.tsx`**
- Plan Free: cambiar "Sin generador de banners" por "2 banners / mes"
- Plan Starter: cambiar "Generador de banners" por "30 banners / mes"
- Plan Pro: cambiar "Generador de banners avanzado" por "150 banners / mes"

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/SettingsPage.tsx` | Agregar indicador banners usados con progress bar |
| `src/pages/AdminDashboard.tsx` | Card total banners + columna banners en top users |
| `supabase/functions/admin-api/index.ts` | Agregar totalBanners y banners_used a /stats |
| `src/pages/Pricing.tsx` | Actualizar features con limites de banners por plan |

