

# Plan: Landing Preview como página de venta real

## Resumen
Crear una nueva página `/landing/preview` que renderiza los bloques generados como una landing de ecommerce real (no cards/bloques técnicos). Al generar en el demo, redirigir automáticamente a esa página.

## Cambios

### 1. Nueva página `src/pages/LandingPreview.tsx`
- Lee los bloques y datos del producto desde `localStorage` (key: `nexsell_preview_data`)
- Renderiza cada tipo de bloque como una sección visual de landing de venta directa:
  - **hero**: Sección grande con título, subtítulo/hook, botón CTA "Comprar ahora"
  - **benefits**: Grid de beneficios con iconos check
  - **features**: Sección con bullets o grid
  - **testimonials**: Cards de testimonios con comillas
  - **objections**: Sección FAQ-style o bloques de objeción/respuesta
  - **offer/urgency**: Badge destacado con precio, descuento, urgencia
  - **cta**: Botón grande final
  - **microcopy**: Trust signals cerca del CTA (envío, seguridad, garantía)
  - **guarantee**: Bloque con garantía destacada
  - **faq**: Acordeón de preguntas
- Botón "Volver y editar" que regresa al `/#demo`
- CTA bloqueado para demo: "Para exportar o descargar esta landing, crea una cuenta." + botón "Crear cuenta y exportar"
- Diseño continuo tipo landing real, sin cards de bloque, sin labels "Bloque 1, 2..."

### 2. Modificar `src/pages/Index.tsx`
- En `handleDemo`: después de recibir los blocks, guardar en `localStorage` (`nexsell_preview_data` = `{ blocks, product }`) y hacer `navigate("/landing/preview")` en vez de `setDemoBlocks`
- Eliminar todo el renderizado de `demoBlocks` (líneas 264-300) — ya no se muestra en Index
- Mantener el formulario demo intacto
- Eliminar estado `demoBlocks` y `blockTypeLabels` (ya no necesarios)

### 3. Modificar `src/App.tsx`
- Importar `LandingPreview` y agregar ruta pública: `<Route path="/landing/preview" element={<LandingPreview />} />`

### Archivos
- **Crear**: `src/pages/LandingPreview.tsx`
- **Editar**: `src/pages/Index.tsx`, `src/App.tsx`

