

# Plan: Texto personalizado, generacion multiple y galeria real en Index

## 4 cambios a implementar

### A. Campo de texto/slogan personalizado en `GenerateBanner.tsx`
- Agregar input `customText` (textarea opcional) entre la seleccion de plantilla y el tamano
- Label: "Texto personalizado o slogan (opcional)"
- Placeholder: "Ej: La mejor calidad al mejor precio"
- Enviar `customText` en el body de la llamada a la edge function

### B. Pasar `customText` al prompt en `generate-banner/index.ts`
- Recibir `customText` del body
- Si existe, agregarlo al prompt: `Custom text/slogan to include prominently on the banner: "${customText}"`
- Instruir a la IA que este texto debe aparecer visible en el banner

### C. Generacion multiple de banners en `GenerateBanner.tsx`
- Cambiar seleccion de plantilla de single a multi-select (checkboxes o toggle en cada card)
- Modificar `TemplateGallery` para aceptar `selectedIds: string[]` y `onToggle: (id) => void`
- Boton cambia a "Generar X Banners con IA" mostrando la cantidad seleccionada
- Al hacer clic, ejecutar las llamadas en paralelo (Promise.all) con cada templateId seleccionado
- Dialog de preview muestra todos los banners generados en un grid con opcion de descargar cada uno o todos

### D. Galeria real de landings en `Index.tsx` (lineas 349-372)
- Reemplazar los 3 ejemplos hardcodeados por una query a `landings` donde `published = true`
- Mostrar hasta 3 landings publicas con: nombre del producto, categoria, y thumbnail (imagen del primer bloque hero si existe, o gradiente como fallback)
- Cada card enlaza a `/p/:slug` para ver la landing real
- Si no hay landings publicadas, mostrar los placeholders actuales como fallback

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `src/pages/GenerateBanner.tsx` | Campo customText + logica generacion multiple |
| `src/components/banner/TemplateGallery.tsx` | Multi-select con checkboxes |
| `supabase/functions/generate-banner/index.ts` | Recibir customText y agregarlo al prompt |
| `src/pages/Index.tsx` | Galeria con landings reales de la BD |

