

# Plan: Mejora de banners para dropshipping

## Problemas identificados

### 1. Precio incorrecto en banners
En `generate-banner/index.ts` lineas 158-160, el precio se calcula artificialmente con 30% de descuento:
```ts
const discountedPrice = Math.round(originalPrice * 0.7);
```
Esto hace que el banner muestre un precio falso. Se debe usar el precio real del producto tal como esta en la base de datos.

### 2. Textos ilegibles en la galeria de plantillas
El componente `TemplateGallery.tsx` muestra cajas con gradientes y emojis, pero los textos de nombre y descripcion son pequenos y dificiles de leer.

### 3. Previews visuales de plantillas
El usuario quiere ver previews reales de como se vera cada plantilla, no solo un icono con gradiente. Se crearan thumbnails estaticos representativos de cada estilo.

### 4. Prompts mejorados para dropshipping
Inspirados en ecoventasrd.com: banners con estilo de tienda Shopify profesional, enfoque en envio gratis, pago contraentrega, urgencia, trust badges, precios claros y grandes.

---

## Cambios

### A. `supabase/functions/generate-banner/index.ts`
- Eliminar el calculo de precio ficticio (lineas 158-160)
- Cambiar el prompt para usar SOLO el precio real: `"$${product.price} CLP"`
- Eliminar referencias a "Antes/Ahora" y precios tachados como default
- Reescribir los 6 `templatePrompts` con estilo dropshipping profesional inspirado en ecoventasrd:
  - **Oferta Directa**: Precio grande y claro, badges de envio gratis, urgencia, CTA "Comprar Ahora"
  - **Hero Producto**: Producto protagonista con fondo oscuro/premium, nombre grande, precio visible
  - **Social Proof**: Estrellas, contador de clientes, testimonios cortos, trust badges
  - **Beneficios Grid**: Producto centrado con iconos de beneficios alrededor, sin texto excesivo
  - **Flash Sale**: Estilo neon urgente, countdown, colores electricos
  - **Lifestyle**: Producto en contexto de uso, tonos calidos, aspiracional
- Todos los prompts instruiran a la IA a mostrar el **precio exacto** del producto

### B. `src/components/banner/TemplateGallery.tsx`
- Redisenar las cards de plantilla para mejor legibilidad:
  - Aumentar padding y tamano de texto
  - Preview area mas grande con una representacion visual del estilo (HTML/CSS mini-preview)
  - Nombre en `font-semibold text-base` (no `text-sm`)
  - Descripcion en `text-sm` con mas espacio
- Cada card mostrara un mini-preview estatico con colores y layout representativo del estilo:
  - Oferta Directa: fondo rojo/naranja con texto de precio grande
  - Hero Producto: fondo oscuro con silueta de producto
  - Social Proof: estrellas doradas prominentes
  - Beneficios Grid: grid de iconos
  - Flash Sale: fondo negro con acentos neon
  - Lifestyle: tonos calidos con efecto foto
- Grid responsive: 2 columnas en movil, 3 en desktop

### C. `src/components/banner/templates.ts`
- Agregar campo `previewColors` a cada template para los colores del mini-preview
- Agregar campo `previewLayout` con tipo de layout visual

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-banner/index.ts` | Fix precio, reescribir prompts dropshipping |
| `src/components/banner/TemplateGallery.tsx` | Redisenar cards con mini-previews visuales |
| `src/components/banner/templates.ts` | Agregar datos de preview visual |

