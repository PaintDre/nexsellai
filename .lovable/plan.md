

# Plan: Rediseño del Generador de Banners

## Resumen

Transformar el generador de banners en un flujo de 4 pasos con plantillas orientadas a ventas, selección única, cantidad configurable, y generación de variaciones automáticas.

## Cambios

### 1. Rediseñar plantillas (`src/components/banner/templates.ts`)

Reemplazar las 6 plantillas actuales por 7 plantillas basadas en estructura de venta:

| ID | Nombre | Etapa de venta |
|----|--------|----------------|
| hook-visual | Hook Visual | Captar atención |
| problema | Problema del Cliente | Identificar dolor |
| solucion | Solución del Producto | Presentar solución |
| beneficio | Beneficio Principal | Destacar ventaja clave |
| prueba-social | Prueba Social | Generar confianza |
| oferta | Oferta e Incentivo | Motivar compra |
| cta | Llamado a la Acción | Cerrar venta |

Cada plantilla mantiene: id, name, description (clara y orientada a marketing), icon, previewBg, previewLayout. Descripciones como "Ideal para captar la atención en los primeros segundos del anuncio".

### 2. TemplateGallery: selección única (`src/components/banner/TemplateGallery.tsx`)

- Cambiar de multi-select (checkboxes) a single-select (radio visual)
- Props: `selectedId: string` y `onSelect: (id: string) => void`
- Actualizar los mini-previews para las 7 nuevas plantillas
- Mantener el diseño visual de cards con preview + nombre + descripción

### 3. Rediseñar GenerateBanner como flujo de 4 pasos (`src/pages/GenerateBanner.tsx`)

Reemplazar el layout actual por un flujo secuencial:

**Paso 1 - Seleccionar plantilla**
- TemplateGallery con selección única
- `selectedTemplate: string` (no array)

**Paso 2 - Descripción del producto**
- Textarea con `minLength={120}` y `maxLength={400}`
- Contador: `{length}/400` con indicador de mínimo
- Label: "Describe tu producto en detalle para generar banners más efectivos"

**Paso 3 - Cantidad de banners**
- 3 botones/cards: 2, 3, o 5 banners
- `bannerCount: number` state

**Paso 4 - Generar y preview**
- Botón generar
- Resultados inline (no dialog) — grid de banners con descarga individual y "Descargar todos"

**Lógica de generación:**
- Para cada banner solicitado, hacer 2 llamadas al edge function (2 variaciones)
- Total de llamadas = `bannerCount * 2`
- Pasar un campo `variation: 1 | 2` al edge function para que el prompt genere variaciones

### 4. Actualizar edge function (`supabase/functions/generate-banner/index.ts`)

- Reemplazar `templatePrompts` con 7 nuevos prompts alineados a las etapas de venta
- Agregar soporte para campo `variation` en el body: cuando `variation === 2`, agregar instrucción al prompt para generar una versión alternativa (diferente composición, colores, layout)
- Cada prompt debe enfocarse en su etapa de venta específica (hook = impacto visual, problema = empatía con dolor del cliente, etc.)

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/banner/templates.ts` | 7 nuevas plantillas de venta |
| `src/components/banner/TemplateGallery.tsx` | Selección única + nuevos previews |
| `src/pages/GenerateBanner.tsx` | Flujo 4 pasos, cantidad, variaciones |
| `supabase/functions/generate-banner/index.ts` | Nuevos prompts + soporte variation |

