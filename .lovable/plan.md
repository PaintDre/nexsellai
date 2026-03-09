

## Plan: Actualizar Prompt del Banner "Hook"

### Contexto
El usuario está proporcionando el primer prompt específico de los 7 tipos de banners. Este es para el tipo **"hook-visual"** (Etapa 1: captar atención).

### Cambio a realizar

**Archivo**: `supabase/functions/generate-banner/index.ts`  
**Líneas**: 58-68 (dentro del objeto `templatePrompts`)

**Estado actual**: Prompt en inglés genérico enfocado en "stop the scroll"

**Nuevo prompt**: Prompt en español mucho más específico con:
- Instrucciones detalladas de composición hiperrealista
- Jerarquía tipográfica clara (título de problema + subtítulo de beneficio + precio)
- Estructura visual definida (superior = problema, centro = producto, abajo = beneficio)
- Ejemplo concreto para referencia (linterna táctica)
- Énfasis en formato 1080x1920 para stories/ads

### Código exacto

```typescript
"hook-visual": `Diseño de landing para e-commerce en formato historia 1080x1920.

Escena hiperrealista de fotografía publicitaria con iluminación de estudio y estilo premium.

Fondo negro elegante con degradados de luz y partículas brillantes que generen profundidad.

El producto aparece en primer plano, muy grande, extremadamente nítido, con reflejos suaves y sombras naturales, como en una fotografía comercial de alta gama.

El producto debe verse impactante y protagonista absoluto de la escena.

Agregar elementos visuales modernos alrededor del producto: destellos de luz, líneas luminosas, figuras geométricas sutiles y efectos de energía para transmitir innovación.

Composición dinámica y moderna, no plana.

Jerarquía tipográfica clara y muy visible:
- TÍTULO GRANDE en la parte superior que exprese el dolor principal del cliente
- Subtítulo corto con el beneficio principal del producto
- Precio visible en la moneda establecida dentro de un elemento destacado como etiqueta o badge luminoso

El producto debe ocupar el centro o ligeramente hacia abajo para dejar espacio al texto superior.

Diseño limpio pero visualmente rico, estilo publicidad premium de e-commerce.

Respetar margen interno de 20 px en todos los bordes.

Estilo completamente fotográfico e hiperrealista, no caricatura, no ilustración.

Pensado para anuncios de Meta Ads y TikTok Ads.

ESTRUCTURA VISUAL:
- Parte superior: Título que toque el problema
- Centro: Producto grande y llamativo
- Debajo o lateral: Beneficio principal
- Elemento destacado: Precio según coloca el usuario

EJEMPLO DE REFERENCIA:
Si el producto fuera una linterna táctica, el texto podría ser:
Título: "No vuelvas a quedarte a oscuras"
Subtítulo: Linterna táctica ultra potente
Precio: $89.900`,
```

### Próximos pasos
Una vez implementado, estaré listo para recibir los otros 6 prompts:
- Problema
- Solución
- Beneficio
- Prueba Social
- Oferta
- CTA

