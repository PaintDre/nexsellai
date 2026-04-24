# Aplicar los 4 cambios al exportador Shopify (literal)

Aplico los 4 cambios exactamente como los especificaste en `src/lib/exportShopify.ts`. Te dejé claro en la pregunta los riesgos: procedo bajo tu confirmación de "aplicar tal cual".

## Cambios a realizar (un solo archivo)

**Archivo:** `src/lib/exportShopify.ts`

### CHANGE 1 — Fallback de imagen hero (alrededor de líneas 242-246)

Reemplazo el bloque actual del hero image (que usa `image_url | image_tag`) por la versión simple con `<img src=...>` y le añado una rama `{% elsif section.settings.hero_image_url != blank %}` que pinta una imagen externa por URL si no se subió `image_picker`.

### CHANGE 2 — Nuevo `addToCartForm` (líneas 209-227)

Reemplazo el `addToCartForm` actual (que usa `nexsell_product` + `routes.cart_add_url`) por la versión que pediste:

- Si existe `product` (template de producto), usa `{% form 'product', product %}` con `product.variants.first.id` y `product.price`.
- Si no, fallback a un `<a href="{{ section.settings.cta_url | default: '#' }}">`.

### CHANGE 3 — Nueva setting `hero_image_url` en el schema (línea 527)

Agrego justo después de `hero_image`:

```ts
{ type: "text", id: "hero_image_url", label: "URL imagen externa (Supabase)", default: escapeSchemaDefault(heroImgSrc) },
```

### CHANGE 4 — `generateShopifyProductTemplate`

Esta función **ya existe** en líneas 749-759 con exactamente la firma que pediste. No se duplica. `generateShopifyTemplate()` se mantiene intacto (lo usa `exportShopifyZip`).

## Riesgos conocidos (te lo recordé y aceptaste)

1. `**section.settings.cta_url**` se referencia en CHANGE 2 pero **no se agrega al schema**. Shopify previamente rechazó esta setting con `FileSaveError: Invalid schema setting cta_url`. Si Shopify vuelve a fallar al guardar el `.liquid`, el siguiente paso será agregar `{ type: "url", id: "cta_url", label: "URL del CTA" }` al schema (sin `default`, porque ese era el problema original).
2. `**{% form 'product', product %}**` solo tiene la variable `product` disponible en templates de producto. En `page.nexsell.json` (página independiente) caerá al fallback `<a href="#">` y no agregará al carrito.
3. La setting `connected_product` queda en el schema pero deja de usarse en el form (queda huérfana, sin efecto).  
  
estamos intentando cambiar el formato de exportado asi que si ves algun error trata de limpiar lo que sobra y agrega lo nuevo que estamos intentando para hacer funcionar esto como landing de producto ahora