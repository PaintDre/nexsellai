

## Plan: Optimizar sección "Mira lo que puedes crear" para móvil

### Problema
La galería de banners (`BannerShowcaseGallery`) muestra 6 imágenes apiladas verticalmente en móvil (`grid-cols-1`), ocupando demasiado espacio y viéndose mal. Cuando no hay imágenes, muestra 3 placeholders grises sin contexto visual.

### Solución
Convertir la galería en un **carousel horizontal (slider)** en móvil, manteniendo el grid actual en tablet/desktop.

### Cambios

**`src/components/landing/BannerShowcaseGallery.tsx`**:
- Importar el hook `useIsMobile` y los componentes `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext` (ya existen en el proyecto).
- En móvil (`isMobile = true`): renderizar las imágenes dentro de un `Carousel` horizontal con dots/arrows para navegar.
- En desktop/tablet: mantener el `grid` actual (`sm:grid-cols-2 lg:grid-cols-3`).
- Cuando no hay imágenes (placeholders), aplicar la misma lógica de carousel en móvil.

### Resultado esperado
- Móvil: slider horizontal con flechas/indicadores, mostrando 1 imagen a la vez.
- Tablet: grid de 2 columnas (sin cambio).
- Desktop: grid de 3 columnas (sin cambio).

