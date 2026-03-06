

## Plan: Agregar preview con zoom para ver banners completos

### Problema
En móvil los banners se ven pequeños dentro del carousel y el usuario no puede apreciar todos los detalles del diseño generado.

### Solución
Agregar un icono de lupa (ZoomIn) sobre cada imagen que al hacer click/tap abra un Dialog a pantalla completa mostrando la imagen en su tamaño real con scroll si es necesario.

### Cambios en `src/components/landing/BannerShowcaseGallery.tsx`

1. **Importar** `Dialog`, `DialogContent`, `DialogTitle` de `@/components/ui/dialog` y `ZoomIn` de `lucide-react`
2. **Agregar estado** `selectedImage` al componente principal para controlar qué imagen se muestra en el dialog
3. **Modificar `ImageCard`** para:
   - Recibir un `onZoom` callback
   - Envolver en un contenedor `relative` con `cursor-pointer`
   - Agregar un botón con icono `ZoomIn` posicionado en la esquina superior derecha (semi-transparente, visible en hover y siempre visible en móvil)
   - Al hacer click en la imagen o en el icono, abrir el dialog
4. **Agregar el Dialog** al final del componente `BannerShowcaseGallery`:
   - Fondo oscuro, imagen centrada con `max-w-full max-h-[90vh] object-contain`
   - URL de la imagen sin restricción de ancho (o `width=1200`) para máxima resolución
   - `DialogTitle` con texto "Vista previa del banner" (accesibilidad)

### Resultado
El usuario podrá tocar cualquier banner para verlo a pantalla completa con todos los detalles visibles, y cerrar con el botón X del dialog.

