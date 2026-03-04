

# Plan: 3 ajustes en la landing page

## 1. Quitar texto y botón de la sección Shopify Tutorial

En `src/pages/Index.tsx`, eliminar las líneas 221-226 (el `<div>` con el texto "Exporta tu landing como HTML..." y el botón "Descargar landing para Shopify").

## 2. Agregar input de imagen al demo

En la sección demo del formulario, agregar:
- Estado: `demoImage` (File | null), `demoImagePreview` (string | null)
- Input tipo file (accept jpg/png/webp) con validación de 5MB max
- Preview de la imagen con opción de eliminar
- Deshabilitar botón "Generar Landing Demo" si no hay imagen cargada
- Icono `ImagePlus` de lucide-react para el área de upload
- Diseño: área de drag/click con borde dashed, preview con thumbnail

## 3. Cambiar colores de morado a verde elegante

En `src/index.css`, cambiar las variables CSS `--primary` y `--ring` de purple (262 83% 58%) a emerald green:

**Light mode:**
- `--primary`: `152 60% 36%` (emerald-700 approx)
- `--ring`: `152 60% 36%`
- `--sidebar-primary`: `152 60% 36%`
- `--sidebar-ring`: `152 60% 36%`

**Dark mode:**
- `--primary`: `152 56% 44%` (emerald-600 approx)
- `--ring`: `152 56% 44%`
- `--sidebar-primary`: `152 56% 44%`
- `--sidebar-ring`: `152 56% 44%`

This single CSS change propagates to all buttons, badges, icons using `text-primary`, `bg-primary`, focus rings, etc. across the entire app.

### Files to modify
- `src/index.css` — color variables
- `src/pages/Index.tsx` — remove Shopify download section + add image upload to demo

