

# Plan: Galeria de Banners Recientes en la Landing

## Objetivo

Reemplazar la seccion de ejemplos actual con una galeria que muestre los ultimos banners generados (imagen completa, sin nombres ni textos extra), con layout responsive y organizado.

## Cambios

### 1. Nuevo componente `src/components/landing/BannerShowcaseGallery.tsx`

- Query a tabla `banners` publica: `select("image_url").order("created_at", { ascending: false }).limit(6)` (traer 6, mostrar al menos 3)
- RLS: los banners ya tienen `image_url` publica (URLs de storage). Si RLS bloquea, usar una edge function o query sin auth.
- Renderizar imagenes sin card, sin nombre, sin badge -- solo la imagen con `rounded-xl overflow-hidden shadow-sm`
- Grid responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Hover: sutil scale con `hover:shadow-md transition-all`
- Si no hay banners, mostrar fallback con placeholders de gradiente

### 2. Actualizar `src/pages/Index.tsx` seccion Ejemplos (~linea 335-346)

- Importar `BannerShowcaseGallery`
- Reemplazar `<LandingExamplesGallery />` por `<BannerShowcaseGallery />`
- Mantener titulo "Mira lo que puedes crear" y subtitulo "Landings y banners generados con Nexsell en segundos"

### 3. RLS consideration

- Verificar si la tabla `banners` tiene politica SELECT publica. Si no, crear una politica que permita leer `image_url` para usuarios anonimos (ya que esta en la landing publica), o alternativamente hacer el query solo para los banners mas recientes sin filtro de user_id.

## Archivos

| Archivo | Cambio |
|---------|--------|
| `src/components/landing/BannerShowcaseGallery.tsx` | Nuevo componente -- galeria de banners recientes |
| `src/pages/Index.tsx` | Reemplazar LandingExamplesGallery por BannerShowcaseGallery |

