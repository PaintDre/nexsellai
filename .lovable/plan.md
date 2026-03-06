

# Explicación del Generador de Banners y Plan de Mejora del Prompt

## ¿Cómo funciona el sistema actual?

El generador de banners tiene **2 partes principales**:

### 1. Frontend (lo que ve el cliente) — `GenerateBanner.tsx`
Un asistente de 4 pasos:
- **Paso 1 - Plantilla**: El cliente elige entre 7 plantillas de embudo de ventas (Hook, Problema, Solución, Beneficio, Prueba Social, Oferta, CTA)
- **Paso 2 - Descripción**: Escribe una descripción del producto (120-400 chars) + configura badges, moneda y tono
- **Paso 3 - Cantidad**: Elige 2, 3 o 5 banners (se asigna automáticamente una secuencia de embudo)
- **Paso 4 - Generar**: Se generan todos los banners y se muestran para descarga

### 2. Backend (el prompt de IA) — `generate-banner/index.ts`
La edge function recibe los datos del producto y construye un prompt largo que incluye:
- **Datos del producto**: nombre, precio, categoría, descripción, audiencia, imagen
- **Plantilla específica**: cada una de las 7 plantillas tiene un prompt distinto que define composición, estilo visual y objetivo
- **Configuración de negocio**: moneda, badges de confianza, tono de comunicación
- **Reglas críticas**: dimensiones, idioma español, no inventar precios, producto como elemento principal

Luego envía todo al modelo `google/gemini-3-pro-image-preview` que genera la imagen.

---

## Problemas actuales para el cliente

1. **Demasiadas opciones confusas**: 7 plantillas, 4 tonos, 6+ badges, moneda, badge personalizado — el cliente no sabe marketing y se abruma
2. **El prompt no analiza la imagen del producto en profundidad**: solo dice "use the provided product image as direct reference" sin instruir al modelo a extraer colores, textura, estilo
3. **Textos en el banner a veces salen mal**: el prompt no tiene suficientes restricciones tipográficas
4. **El cliente elige plantilla pero el sistema la ignora**: al elegir cantidad (2, 3, 5), se usa una secuencia fija predefinida, no la plantilla seleccionada

---

## Plan: Simplificar UX + Mejorar Prompt

### Cambios en el Frontend (`GenerateBanner.tsx`)

**Simplificar a 3 pasos** (eliminar paso de plantilla):
1. **Descripción** — solo descripción del producto + slogan opcional
2. **Cantidad y tamaño** — 2, 3, o 5 banners + tamaño
3. **Generar** — resumen y botón

**Eliminar del cliente**:
- Selector de plantilla (paso 1 completo) — la secuencia de embudo se asigna automáticamente
- Selector de tono — se usa "professional" por defecto (el prompt decidirá según el producto)
- Badges de confianza, garantía, entrega rápida, badge personalizado — se eliminan del UI del cliente
- Selector de moneda — se usa la moneda del producto (ya está en la BD)

**Mantener**:
- Descripción del producto (120-400 chars)
- Campo de slogan/texto personalizado
- Cantidad de banners (2, 3, 5)
- Tamaño de salida

### Cambios en templates (`templates.ts`)
- Eliminar `TemplateGallery.tsx` de la vista del cliente (mantenerlo para admin si se necesita)
- Actualizar `STEPS` a 3 pasos

### Cambios en el Backend (`generate-banner/index.ts`)

**Reescribir el prompt completo** para que sea un diseñador gráfico profesional de nivel agencia. El nuevo prompt:

1. **Analiza la imagen del producto en profundidad**: extrae paleta de colores dominante, textura, forma, estilo (minimalista, premium, casual, tech), y usa eso para decidir fondo, tipografía y composición
2. **Decisiones automáticas de diseño**: el modelo decide tono, colores y estilo basándose en el análisis del producto — no el cliente
3. **Reglas tipográficas estrictas**: máximo 2 líneas de texto, fuente mínima legible, contraste WCAG, no más de 8 palabras por línea
4. **Composición basada en la regla de tercios**: producto en el punto focal, espacio negativo calculado
5. **Eliminar badges del prompt**: ya no se incluyen badges de confianza forzados — el diseño queda limpio y profesional

**Nuevo prompt base** (reemplaza todos los `templatePrompts`):

Cada etapa del funnel tendrá un prompt más corto y enfocado que instruye al modelo a:
- Primero ANALIZAR la imagen del producto (colores, forma, estilo, categoría)
- Luego DISEÑAR usando principios de diseño gráfico profesional
- Finalmente COMPONER con reglas estrictas de legibilidad y jerarquía visual

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/GenerateBanner.tsx` | Eliminar paso 1 (plantillas), eliminar config de badges/tono/moneda del UI, reducir a 3 pasos |
| `src/components/banner/templates.ts` | Mantener plantillas para lógica interna pero simplificar opciones visibles |
| `supabase/functions/generate-banner/index.ts` | Reescribir prompt completo con análisis de imagen, diseño profesional, y reglas tipográficas estrictas |

### Resultado para el cliente

El cliente solo necesita:
1. Escribir qué hace su producto (120-400 chars)
2. Elegir cuántos banners quiere
3. Hacer clic en "Generar"

La IA se encarga de todo lo demás: analiza la imagen, elige colores, define el tono, y genera banners de nivel profesional. El cliente siente que tiene un diseñador de agencia trabajando para él.

