

# Plan: Auto-generación de banners integrados en landing + Renderizado visual mejorado

## Qué se construye

Al generar una landing, el sistema automáticamente generará banners AI para las secciones clave (Hero, Benefits, Offer/CTA), y el renderer mostrará estos banners como elementos visuales prominentes dentro de cada sección.

## Cambios

### 1. `src/pages/GenerateLanding.tsx` — Agregar toggle + auto-generación
- Nuevo estado `autoImages` (boolean, default true para Starter/Pro)
- Switch "Incluir imágenes IA" visible solo para Starter/Pro, deshabilitado para Free con texto "Disponible en Starter"
- Estado de progreso en dos pasos: "Generando copy..." → "Generando imágenes..."
- Después de insertar la landing con bloques de texto, si `autoImages` está activo:
  - Llamar a `generate-banner` para secciones `hero` y `offer` (o `cta` si no hay offer)
  - El edge function ya actualiza los bloques con `image_url` automáticamente
- Navegar a la landing view al terminar

### 2. `src/components/landing/LandingRenderer.tsx` — Renderizado visual mejorado
- **Hero con banner**: Si `hero.image_url` existe, usarlo como fondo con overlay gradient + texto superpuesto (en lugar del layout lado a lado actual)
- **Benefits/Features con banner**: Mostrar banner como imagen lateral (50/50 split) junto al listado de beneficios
- **Offer/CTA con banner**: Banner como fondo de sección con overlay oscuro y texto de oferta superpuesto
- Mantener fallback al diseño actual cuando no hay `image_url`

### 3. `supabase/functions/generate-landing/index.ts` — Estructura por plan
- Reforzar el prompt para que genere secciones consistentes según el plan:
  - Free: hero, benefits, cta (3 bloques)
  - Starter: hero, benefits, features, testimonials, objections, faq, urgency, cta (8 bloques)
  - Pro: suite completa con comparison, bundles, guarantee, microcopy (13+ bloques)

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/GenerateLanding.tsx` | Toggle auto-imágenes + generación en 2 pasos |
| `src/components/landing/LandingRenderer.tsx` | Banners como fondos/layouts visuales por sección |
| `supabase/functions/generate-landing/index.ts` | Prompt estandarizado por plan |

