

# Plan: Rediseño de la Pagina Principal (Index.tsx)

## Resumen

Reestructurar y mejorar visualmente la landing page principal de Nexsell siguiendo el orden solicitado, con mejor espaciado, una nueva seccion "Problema/Solucion", hero mas impactante con preview mockup, y responsive mobile-first.

## Estructura de secciones (nuevo orden)

1. **Hero** (mejorado con mockup visual)
2. **Problema / Solucion** (nueva seccion)
3. **Beneficios** (existente, mejorado)
4. **Como funciona** (existente, mantener)
5. **Ejemplos del sistema** (mover LandingExamplesGallery aqui como seccion propia)
6. **Demo generator** (formulario existente)
7. **Planes** (existente)
8. **FAQ** (existente)
9. **CTA final** (existente)

*Se elimina la seccion "Shopify Tutorial" del flujo principal para simplificar -- se puede mover a una pagina separada o integrar como nota en FAQ.*

## Cambios detallados

### 1. Hero -- Mas impactante

- Cambiar layout a 2 columnas en desktop: texto a la izquierda, mockup/preview a la derecha
- Mockup: un div estilizado que simula una pantalla con un preview de landing (gradiente + iconos, sin imagen real necesaria)
- Aumentar padding: `py-24 lg:py-40`
- Agregar gradiente sutil de fondo con `bg-gradient-to-b from-primary/5 to-background`
- Mobile: stack vertical, texto centrado

### 2. Problema / Solucion (nueva)

- Layout 2 columnas: izquierda "El problema" (pain points con iconos X rojos), derecha "La solucion" (beneficios con checks verdes)
- 3 pain points: "Disenar landings toma horas", "Contratar un disenador es caro", "Las plantillas genericas no venden"
- 3 soluciones: "Genera en 30 segundos", "Sin costo de diseno", "Copy optimizado para conversion"
- Background: `bg-muted/50`

### 3. Beneficios -- Mejorar cards

- Agregar mas beneficios (6 en total, grid `md:grid-cols-3`): Rapido, Optimizado para ventas, Sin codigo, Banners IA, Exportar HTML, Multiproducto
- Cards con hover effect (`hover:shadow-md transition-shadow`)

### 4. Ejemplos -- Seccion independiente

- Mover `LandingExamplesGallery` fuera del bloque demo a su propia seccion con titulo "Mira lo que puedes crear"
- Grid responsive: 1 col mobile, 2 tablet, 3 desktop

### 5. Espaciado y responsive

- Todas las secciones: `py-20 lg:py-28` para mayor respiro
- Max width contenido: `max-w-6xl` general, `max-w-3xl` para texto centrado
- Grids: usar `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` consistentemente
- Botones mobile: `w-full sm:w-auto`

### 6. Footer mejorado

- Agregar links: Pricing, Login, Register
- Layout en columnas simple

## Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Index.tsx` | Reescribir estructura completa con nuevo orden de secciones |

No se necesitan cambios en base de datos ni edge functions. Solo cambios de UI/layout.

