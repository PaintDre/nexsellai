

## Plan: Mostrar imágenes completas sin recorte

### Problema
Varias imágenes de banners y previews usan `object-cover` con contenedores de aspecto fijo (`aspect-square`, `aspect-video`), lo que recorta el contenido generado.

### Cambios por archivo

**1. `src/pages/Banners.tsx`** — Tarjetas de banner en el grid
- Línea 200: Cambiar `aspect-square` a `aspect-auto` y ajustar el contenedor para que se adapte al contenido
- Línea 204: Cambiar `object-cover` → `object-contain` en la imagen de la tarjeta
- El modal de preview (línea 385) ya usa `w-full h-auto` sin `object-cover` — está correcto, no se toca

**2. `src/components/landing/BannerShowcaseGallery.tsx`** — Galería en landing page pública
- Línea 24: Cambiar `object-cover` → `object-contain` en el `ImageCard`

**3. `src/components/landing/LandingRenderer.tsx`** — Imagen del producto en hero de landing
- Línea 255: Cambiar `object-cover` → `object-contain` en la imagen hero del producto
- Líneas 276 y 353: Cambiar `object-cover` → `object-contain` en imágenes de beneficios y características

**4. `src/components/landing/LandingExamplesGallery.tsx`** — Miniaturas de landings
- Línea 69: Cambiar `object-cover` → `object-contain`

**5. `src/pages/Landings.tsx`** — Lista de landings
- Línea 194: Cambiar `object-cover` → `object-contain`

### Archivos que NO se tocan (son fotos de producto, no banners generados)
- `ProductForm.tsx` — Upload de fotos de producto (crop es correcto)
- `ProductDetail.tsx` — Thumbnail de producto (crop es correcto)
- `Products.tsx` — Card de producto (crop es correcto)
- `GenerateBanner.tsx` — Mini thumbnail de producto seleccionado (crop es correcto)
- `Index.tsx` — Preview de imagen demo en upload (crop es correcto)

### Resultado
Todas las imágenes generadas por IA (banners, landing previews) se mostrarán completas sin recorte, mientras que las fotos de producto subirán manteniendo su comportamiento actual con crop.

