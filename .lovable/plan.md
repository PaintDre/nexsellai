

# Plan: Mejorar secuencia de venta, preview y galeria de banners

## 3 mejoras principales

### 1. Secuencia de venta inteligente en el edge function

**Archivo:** `supabase/functions/generate-banner/index.ts`

Cuando se generan multiples banners (2, 3 o 5), en vez de generar todos con la misma plantilla, asignar automaticamente plantillas de la secuencia de venta segun la cantidad:

| Cantidad | Secuencia asignada |
|----------|-------------------|
| 2 | hook-visual, oferta |
| 3 | hook-visual, beneficio, oferta |
| 5 | hook-visual, problema, solucion, beneficio, oferta |

Agregar al prompt instrucciones para que cada banner use textos unicos y angulos de venta diferentes. Incluir un campo `sequencePosition` y `totalInSequence` para que el AI sepa su rol en la secuencia y no repita frases.

**Archivo:** `src/pages/GenerateBanner.tsx`

- Actualizar la logica de `handleGenerate` para enviar la secuencia de plantillas en vez de repetir la misma
- Mostrar en los resultados la etapa de venta de cada banner (ej: "1/5 — Hook Visual")

### 2. Preview modal en la galeria `/banners`

**Archivo:** `src/pages/Banners.tsx`

- Agregar boton "Vista previa" (icono Eye) junto al boton Descargar en cada card
- Al hacer clic, abrir un Dialog/modal con la imagen a tamano completo
- El modal incluye: imagen grande, nombre de plantilla, fecha, botones Descargar y Cerrar
- Permitir navegar entre banners con flechas dentro del modal

### 3. Preview inline en GenerateBanner despues de generar

**Archivo:** `src/pages/GenerateBanner.tsx`

- Al hacer clic en un banner generado, abrir el mismo tipo de modal de preview (imagen grande)
- Mostrar etiqueta de etapa de venta en cada banner generado

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-banner/index.ts` | Agregar secuencia de venta, textos unicos por posicion |
| `src/pages/GenerateBanner.tsx` | Logica de secuencia, preview modal en resultados |
| `src/pages/Banners.tsx` | Boton preview + modal de vista previa |

