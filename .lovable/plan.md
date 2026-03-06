

## Plan: Corregir recorte de banners en el carousel móvil

### Problema
En la sección "Mira lo que puedes crear" en móvil, las imágenes del carousel se recortan porque el contenedor `CarouselContent` usa `overflow-hidden` internamente y el `ImageCard` también tiene `overflow-hidden`, limitando la altura visible de banners con proporciones verticales (ej: 1080x1350).

### Solución

**`src/components/landing/BannerShowcaseGallery.tsx`**:

1. **Reducir el ancho del carousel item** para que la imagen completa quepa en viewport: agregar `className="basis-[85%]"` al `CarouselItem` en móvil para que la imagen se escale proporcionalmente y se vea entera sin desbordar la pantalla.

2. **Limitar la altura máxima de la imagen** con `max-h-[70vh]` en el `ImageCard` para que banners muy altos no ocupen toda la pantalla y siempre se vean completos dentro del viewport.

3. **Agregar fondo al contenedor** de la imagen (`bg-muted`) para que el espacio sobrante en banners horizontales se vea limpio.

### Resultado
Las imágenes se mostrarán completas (sin cortes) dentro del carousel, escalándose proporcionalmente al viewport del dispositivo.

