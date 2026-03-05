

# Iteración 2: Imágenes en beneficios + Rediseño "Cómo funciona"

## Alcance

Esta iteración cubre 3 mejoras concretas. El "sistema de banners inteligentes" (detección de texto en imágenes) queda para una iteración posterior por su complejidad.

---

### 1. Auto-generación de imágenes para sección Benefits

**Problema:** `GenerateLanding.tsx` solo genera banners automáticos para Hero y Offer/CTA. La sección de beneficios queda sin imagen.

**Cambio en `src/pages/GenerateLanding.tsx`:**
- Agregar el bloque `benefits` a la lista de secciones que reciben auto-generación de imágenes
- Usar template `beneficios-grid` para esta sección
- Actualizar el step label para reflejar que genera 3 imágenes (Hero + Benefits + Offer)

**Cambio en `supabase/functions/generate-banner/index.ts`:**
- Ajustar el prompt de `beneficios-grid` para que genere imágenes sin texto, enfocadas en demostrar visualmente el producto en uso (coherente con el beneficio descrito)
- Agregar instrucción: "Do NOT include any text on the image. Show only the product being used in context."

---

### 2. Rediseño sección "Cómo funciona" en Index.tsx

**Problema:** La sección actual tiene solo 3 pasos genéricos sin impacto visual.

**Nuevo diseño con 4 pasos:**

| Paso | Título | Descripción |
|------|--------|-------------|
| 1 | Sube imágenes de tu producto | Agrega fotos y descripción de tu producto |
| 2 | La IA analiza tu producto | Nuestro motor entiende tu producto y audiencia |
| 3 | Se generan landing + banners + secciones | Landing completa con imágenes IA y copy optimizado |
| 4 | Exporta y publica en tu tienda | Descarga HTML listo para Shopify u otra plataforma |

**Diseño:** Cards con iconos grandes, línea conectora entre pasos, badges descriptivos en paso 3 mostrando los outputs (Landing, Banners, Secciones).

---

### 3. Mejora visual de la demo en Index.tsx

**Problema:** La sección demo no muestra ejemplos visuales del resultado.

**Cambios:**
- Agregar debajo del formulario demo una mini-galería de "Ejemplos de landings generadas" con 3 cards que muestren screenshots/mockups estáticos representando diferentes tipos de productos
- Cada card muestra: nombre de producto ejemplo, categoría, y un badge de "Vista previa"
- Son elementos estáticos decorativos (no funcionales), solo para mostrar el potencial

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/GenerateLanding.tsx` | Agregar benefits a auto-generación de imágenes |
| `supabase/functions/generate-banner/index.ts` | Mejorar prompt de benefits para imágenes sin texto |
| `src/pages/Index.tsx` | Rediseñar "Cómo funciona" (4 pasos) + mini-galería de ejemplos |

