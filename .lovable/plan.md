

# Plan: Actualizar Prompt del Banner "Solución"

## Cambio a realizar

**Archivo**: `supabase/functions/generate-banner/index.ts`  
**Líneas**: 82-92 (clave `"solucion"` dentro de `templatePrompts`)

**Estado actual**: Prompt en inglés genérico enfocado en "transition from problem to hope"

**Nuevo prompt**: Prompt en español mucho más detallado con:
- Producto mostrado en uso por una persona real
- Expresión de alivio/comodidad del usuario
- Iluminación cinematográfica y elementos modernos
- Jerarquía específica: título de solución + 2-3 bullets explicativos
- Estructura visual clara (superior = título, centro = producto en uso, lateral/inferior = bullets)
- Ejemplo concreto (afeitadora eléctrica)
- Clave psicológica: "Ah... así funciona" en 1 segundo visual

## Código a implementar

Reemplazar las líneas 82-92 con:

```typescript
"solucion": `Diseño de imagen para landing de e-commerce en formato vertical 1080x1920.

Estilo hiperrealista de fotografía publicitaria premium.

Fondo negro elegante con degradados de luz y efectos luminosos modernos para transmitir innovación y tecnología.

La escena debe mostrar claramente el producto como la SOLUCIÓN al problema presentado anteriormente.

El producto aparece en primer plano o siendo utilizado por una persona de manera natural (en la mano, aplicado, instalado o en uso dependiendo del producto).

La expresión de la persona debe transmitir alivio, comodidad o facilidad al usar el producto.

Iluminación cinematográfica con reflejos suaves sobre el producto para resaltarlo como protagonista.

Agregar elementos visuales modernos alrededor del producto como líneas luminosas, partículas brillantes, destellos o pequeños iconos señalando características clave.

Composición dinámica y visualmente rica, con profundidad de campo y enfoque claro en el producto.

Jerarquía tipográfica clara:
- Título grande en la parte superior que comunique que el producto es la solución
- Debajo del producto incluir 2–3 bullets cortos explicando: cómo funciona, por qué es práctico, qué lo hace diferente

Mantener márgenes internos de 20 px en todos los bordes para evitar cortes.

Estilo completamente fotográfico e hiperrealista, no ilustración ni caricatura.

Pensado para anuncios de Meta Ads y TikTok Ads.

ESTRUCTURA VISUAL:
- Parte superior: Título que presenta la solución
- Centro: Producto en uso o claramente visible
- Lateral o parte inferior: 2–3 bullets explicativos

EJEMPLO DE REFERENCIA:
Si el producto fuera una afeitadora eléctrica portátil:
Título: "La forma fácil de afeitarte en segundos"
Bullets:
✔ Diseño compacto y portátil
✔ Corte preciso y rápido
✔ Ideal para usar en cualquier lugar

CLAVE PSICOLÓGICA:
El cliente debe pensar inmediatamente: "Ah… así funciona."
No debe haber confusión. La escena debe explicar el producto en 1 segundo visual.`,
```

## Próximos pasos

Una vez implementado, quedarán 5 prompts por actualizar:
- Problema
- Beneficio
- Prueba Social
- Oferta
- CTA

