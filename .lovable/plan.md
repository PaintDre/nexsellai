

# Plan: Unificar Banners dentro del Sistema de Landings + Corregir Bug

## Problema actual
1. **Bug en `generate-banner`**: Usa `supabase.auth.getClaims(token)` que NO existe en supabase-js. Debe usar `supabase.auth.getUser(token)` como ya se hace en `generate-landing`.
2. **Dos flujos separados** (landings + banners) que confunden al usuario.

## Solución: Un solo espacio de trabajo

En lugar de generar banners por separado, integrar la generación de imágenes AI **dentro del flujo de landing**. Cada sección de la landing podrá tener una imagen banner generada por IA.

### Flujo unificado

```text
Producto → Generar Landing → AI genera bloques de texto (como ahora)
                            → Opción: "Generar imágenes para secciones" 
                            → AI genera banners para hero, offer, etc.
                            → Todo se muestra junto en el renderer
```

### Cambios concretos

#### 1. Corregir bug en edge function `generate-banner`
**Archivo:** `supabase/functions/generate-banner/index.ts`
- Reemplazar `supabase.auth.getClaims(token)` por `supabase.auth.getUser(token)`
- Extraer `user.id` del resultado

#### 2. Agregar generación de imágenes al flujo de landing
**Archivo:** `src/pages/LandingView.tsx`
- Agregar botón "Generar imagen para esta sección" en cada bloque (hero, offer, benefits)
- Al hacer click, llama a `generate-banner` con el contexto del bloque
- La imagen generada se guarda en el JSON de blocks como `block.image_url`
- Actualiza el landing en la DB con el nuevo blocks array

#### 3. Actualizar el Renderer para mostrar imágenes por sección
**Archivo:** `src/components/landing/LandingRenderer.tsx`
- Cada sección verifica si su block tiene `image_url`
- Si existe, muestra la imagen generada como visual de la sección
- El hero ya soporta imagen; extender a benefits, offer, testimonials

#### 4. Simplificar la página GenerateBanner
**Archivo:** `src/pages/GenerateBanner.tsx`
- Cambiar para que sea un generador de imágenes para secciones de landing existentes
- Selector: elegir una landing existente → elegir qué sección → elegir template → generar
- La imagen se guarda directamente en el bloque de la landing

#### 5. Actualizar GenerateLanding con opción de template visual
**Archivo:** `src/pages/GenerateLanding.tsx`
- Agregar selector de plantilla visual (template de banner) como paso opcional
- Después de generar los bloques de texto, ofrecer "¿Generar imágenes automáticamente?"
- Si acepta, genera imágenes para hero y offer/CTA automáticamente

#### 6. Exportación incluye imágenes generadas
**Archivo:** `src/lib/exportLanding.ts`
- Al exportar HTML/ZIP, incluir las `image_url` de cada bloque en las secciones correspondientes

### Navegación
- **Mantener** `/banners` como galería de todas las imágenes generadas
- **Mantener** el botón "Generar Banner" en productos, pero redirigir al flujo integrado
- La sidebar sigue mostrando "Banners" para ver el historial

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-banner/index.ts` | Fix auth bug (`getClaims` → `getUser`) |
| `src/pages/LandingView.tsx` | Agregar botón "generar imagen" por sección |
| `src/components/landing/LandingRenderer.tsx` | Renderizar `block.image_url` en cada sección |
| `src/pages/GenerateBanner.tsx` | Reorientar como generador de imágenes para secciones |
| `src/pages/GenerateLanding.tsx` | Agregar opción de generar imágenes post-landing |
| `src/lib/exportLanding.ts` | Incluir imágenes de bloques en exportación |

### Sin cambios de base de datos
Las imágenes se guardan como URLs dentro del JSON `blocks` existente (campo `image_url` por bloque). La tabla `banners` sigue sirviendo como historial/galería.

