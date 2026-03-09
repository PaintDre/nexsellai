
## Objetivo
Enviar hasta 3 imágenes del producto al modelo de IA (en vez de siempre solo la primera), para que tenga más ángulos/perspectivas del producto y genere banners más coherentes y fieles.

## Lógica
- 1 imagen cargada → envía 1
- 2 imágenes → envía 2
- 3 o 4 imágenes → envía las primeras 3 (máximo 3)

## Cambios en `supabase/functions/generate-banner/index.ts`

### 1. Logging actualizado (línea 492)
```typescript
const productImages = (product.images || []).slice(0, 3);
const imageCount = productImages.length;
console.log(imageCount > 0
  ? `✅ Sending ${imageCount} product image(s) for: ${product.name}`
  : `⚠️ No product image for: ${product.name}`
);
```

### 2. Texto del prompt (líneas 503-508)
Cambiar la instrucción de imagen para reflejar si se envían múltiples ángulos:
```typescript
${imageCount > 0
  ? `CRITICAL IMAGE INSTRUCTION:
${imageCount} REAL product image(s) are attached to this message.
${imageCount > 1 ? `These images show the SAME product from different angles/views.` : ""}
You MUST use this EXACT product image as the primary visual element.
- Analyze its colors, textures, shape, and style across ALL provided images
- Extract the dominant color palette and use it for backgrounds, gradients, and accents
- Do NOT recreate or reimagine the product from scratch
- The product in the banner must match the attached image(s) exactly`
  : "No product image provided — generate a representative product visualization."}
```

### 3. Inyección de imágenes (líneas 522-527)
Reemplazar el bloque que solo envía `images[0]` para iterar sobre `productImages`:
```typescript
for (const imgUrl of productImages) {
  userContent.push({
    type: "image_url",
    image_url: { url: imgUrl },
  });
}
```

## Archivos a modificar
- `supabase/functions/generate-banner/index.ts` (3 cambios pequeños, ~15 líneas)
- Re-deploy automático del edge function

## Sin cambios en BD ni en frontend — es puramente lógica del prompt.
