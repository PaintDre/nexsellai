

# Plan: Mejorar Copy de la Landing Page Principal

## Resumen

Actualizar el contenido textual de `src/pages/Index.tsx` para que sea mas claro, persuasivo y enfocado en conversion. La estructura de secciones ya esta bien organizada; el cambio es puramente de copy.

## Cambios en `src/pages/Index.tsx`

### Hero (lineas 168-186)
- Headline: "Crea landings y banners que venden tu producto en minutos"
- Subheadline: "Nexsell usa inteligencia artificial para generar paginas de venta y banners optimizados para ecommerce y dropshipping."
- Boton 1: "Probar gratis" (mantener)
- Boton 2: "Ver como funciona" (cambiar de "Ver planes" a ancla #how)

### Problema / Solucion (lineas 241-246, arrays lineas 30-39)
- Titulo: "Crear paginas de venta no deberia ser tan dificil"
- Problems: "Crear paginas de venta y banners toma horas", "Contratar un disenador o copywriter es caro", "Las plantillas genericas no convierten visitas en ventas"
- Solutions: "Genera landings y banners en segundos con IA", "Sin costos extras de diseno ni redaccion", "Copy y estructura optimizados para conversion"

### Beneficios (lineas 42-49, 287-291)
- Titulo: "Todo lo que necesitas para vender mas"
- Subtitulo: "Herramientas disenadas para convertir visitantes en compradores"
- Actualizar los 6 beneficios:
  1. "Landings de alta conversion" / "Genera paginas de venta con estructura optimizada para que tus visitantes compren."
  2. "Banners listos para anuncios" / "Crea banners promocionales para Facebook, Instagram y Google Ads."
  3. "Prueba diferentes angulos" / "Genera multiples versiones con distintos hooks y enfoques de venta."
  4. "Exporta listo para tu tienda" / "Descarga HTML listo para Shopify, WooCommerce o cualquier plataforma."
  5. "Sin codigo ni diseno" / "Solo describe tu producto. La IA escribe el copy y arma la pagina."
  6. "Multi-producto" / "Administra todos tus productos y genera contenido para cada uno."

### Como funciona (lineas 51-56, 312-313)
- Titulo: "Como funciona" (mantener)
- Subtitulo: "De producto a pagina de venta lista en 4 pasos"
- Pasos:
  1. "Sube tu producto" / "Agrega imagenes, nombre, precio y descripcion de tu producto."
  2. "La IA analiza todo" / "Nuestro motor identifica los mejores angulos de venta para tu producto."
  3. "Genera landings y banners" / "Obtén paginas de venta y banners con copy persuasivo al instante."
  4. "Publica y vende" / "Exporta el HTML a tu tienda y empieza a recibir ventas."

### Ejemplos (lineas 339-344)
- Titulo: "Mira lo que puedes crear" (mantener)
- Subtitulo: "Landings y banners generados con Nexsell en segundos"

### CTA Final (lineas 507-519)
- Titulo: "Crea tu primera landing en minutos"
- Subtitulo: "Registrate gratis y genera tu primera pagina de venta con inteligencia artificial."
- Boton principal: "Comenzar gratis"
- Boton secundario: "Ver como funciona" (ancla #how)

### Seccion "Como funciona" - agregar id
- Agregar `id="how"` al section de "Como funciona" para que los botones "Ver como funciona" funcionen

## Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Index.tsx` | Actualizar copy en hero, problema/solucion, beneficios, como funciona, ejemplos y CTA final |

No se necesitan cambios de base de datos ni edge functions.

