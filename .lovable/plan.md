

# Plan: Banners centrados en el producto — 1 por etapa, impacto visual unico

## Cambios

### 1. Eliminar variaciones — 1 banner por etapa

**`src/pages/GenerateBanner.tsx`** (linea 97)
- Eliminar el loop `for (let variation = 1; variation <= 2; variation++)` — generar solo 1 llamada por templateId
- Eliminar el campo `variation` del body
- Eliminar la propiedad `variation` del objeto resultado
- Actualizar textos de UI que mencionen "variaciones" o "imagenes total"

**`src/components/banner/templates.ts`** (lineas 78-82)
- Actualizar `bannerQuantityOptions` para reflejar cantidades directas sin multiplicar

### 2. Reescribir prompts — producto como protagonista, sin forzar fondo oscuro

**`supabase/functions/generate-banner/index.ts`** (lineas 8-83)

Reescribir todos los `templatePrompts` con esta filosofia:
- **El producto es el heroe absoluto** — siempre centrado, grande, en alta calidad
- **El fondo se adapta al producto**, no al reves. Puede ser gradiente, solido, con textura o ambiental segun lo que mejor resalte ese producto especifico
- **Impacto visual unico por producto** — el AI debe analizar la imagen del producto y elegir colores/composicion que lo complementen
- **Tipografia bold y moderna** — estilo influencer/dropshipping profesional
- **Badges de confianza** siempre presentes pero integrados al diseno

Cada etapa del funnel mantiene su rol pero con enfoque producto-centrico:
- **Hook**: producto hero con tipografia impactante que genere curiosidad
- **Problema**: producto pequeno/lejano, contexto del dolor del cliente
- **Solucion**: producto grande, brillante, como respuesta
- **Beneficio**: producto + iconografia de la ventaja clave
- **Prueba social**: producto + estrellas/reviews integrados
- **Oferta**: producto + precio exacto + badges urgencia
- **CTA**: producto + boton CTA como focal point

### 3. Actualizar CRITICAL RULES del prompt final (lineas 226-235)

Reemplazar las reglas criticas para:
- NO forzar fondo oscuro/negro — el fondo debe complementar el producto
- El producto SIEMPRE debe ser el elemento mas grande y prominente
- Usar la imagen del producto proporcionada como referencia directa
- Colores que hagan contraste con el producto, no genericos
- Eliminar referencia a "variation" instruction

### 4. Eliminar variation instruction (lineas 195-204)

Eliminar el bloque `variationInstruction` ya que no habra variaciones.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-banner/index.ts` | Reescribir prompts producto-centricos, eliminar variation logic |
| `src/pages/GenerateBanner.tsx` | Eliminar loop de variaciones, 1 banner por etapa |
| `src/components/banner/templates.ts` | Actualizar labels de cantidad |

