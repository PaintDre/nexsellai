

# Plan: Dimensiones dinámicas en prompts + Secuencia de 7 banners

## Problema

1. Todos los prompts de plantilla tienen **"1080x1920" hardcodeado** en el texto, pero el usuario puede elegir otras medidas (1080x1080, 1200x628, etc.)
2. Solo hay opciones de 2, 3 y 5 banners — falta la secuencia completa de **7 banners**

## Cambios a realizar

### 1. `supabase/functions/generate-banner/index.ts`

**En cada prompt de plantilla** (hook-visual, problema, solucion, beneficio, prueba-social, oferta, cta): reemplazar todas las menciones de `1080x1920` y `formato vertical` por un placeholder `{{DIMENSIONS}}` y `{{FORMAT_DESC}}`.

**En la lógica de construcción del prompt** (alrededor de línea 400): después de parsear `width` y `height`, calcular la orientación (vertical, horizontal, cuadrado) y reemplazar los placeholders en `templateStyle` antes de inyectarlo al prompt final.

```typescript
const [width, height] = (outputSize || "1080x1080").split("x").map(Number);
const formatDesc = height > width ? "formato vertical" : width > height ? "formato horizontal" : "formato cuadrado";
const resolvedStyle = templateStyle
  .replaceAll("{{DIMENSIONS}}", `${width}x${height}`)
  .replaceAll("{{FORMAT_DESC}}", formatDesc);
```

Luego usar `resolvedStyle` en vez de `templateStyle` en la línea 492.

**También actualizar el `SYSTEM_PROMPT`** (línea 27) para que no diga "formato historia 1080x1920" sino que sea genérico.

### 2. `src/components/banner/templates.ts`

Agregar opción de 7 banners:

```typescript
{ value: 7, label: "7 banners", description: "Funnel de venta completo" },
```

### 3. `src/pages/GenerateBanner.tsx`

Agregar secuencia de 7 en `SEQUENCES`:

```typescript
7: ["hook-visual", "problema", "solucion", "beneficio", "prueba-social", "oferta", "cta"],
```

## Resultado

- Las imágenes se generarán con las dimensiones que el usuario seleccione
- Se podrá elegir la secuencia completa de 7 banners con todas las etapas del funnel

