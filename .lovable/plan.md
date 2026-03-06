

## Plan: Mostrar banners completos sin recorte en el carousel

### Problema
La imagen del screenshot muestra que el banner se corta arriba y abajo en el carousel móvil. El `max-h-[70vh]` junto con `overflow-hidden` en el contenedor y el `width=400` en la imagen limitan la visibilidad del banner completo.

### Cambios en `src/components/landing/BannerShowcaseGallery.tsx`

**ImageCard**:
- Quitar `max-h-[70vh]` del contenedor y de la imagen — esto es lo que recorta banners verticales altos
- Quitar `overflow-hidden` del contenedor para que no recorte
- Quitar `width={400} height={400}` hardcodeados que distorsionan la proporción
- Quitar el `?width=400&quality=75` del render URL (o aumentarlo a `width=800`) para que la imagen cargue con más resolución y se vea completa
- Mantener `object-contain`, `w-full`, `h-auto` para que la imagen se adapte al ancho del contenedor mostrando todo el contenido

**Carousel móvil**:
- Cambiar `basis-[85%]` a `basis-full` para que cada banner ocupe el ancho completo del viewport y así se vea más grande y con todos los detalles visibles

### Resultado
El banner se mostrará completo (incluyendo "ÚLTIMAS UNIDADES" arriba y "Garantía 30 días | OFERTA" abajo) sin recortes, adaptándose al tamaño natural de la imagen.

