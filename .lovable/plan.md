
# Plan: Implementación del Prompt Base

## Cambio a realizar

Actualizaré el archivo `supabase/functions/generate-banner/index.ts` reemplazando el `SYSTEM_PROMPT` actual (líneas 27-52) con el nuevo prompt base que proporcionaste.

### Antes (líneas 27-52):
- Prompt en inglés enfocado en análisis de producto
- Proceso de diseño en 3 pasos
- Énfasis en paleta de colores y composición

### Después:
- Prompt en español orientado a formato historia 1080x1920
- Estilo hiperrealista con fondo negro
- Iluminación cinematográfica y elementos modernos
- Jerarquía AIDA clara
- Márgenes de 20px
- Optimizado para Meta Ads y TikTok Ads

## Código exacto a implementar

```typescript
const SYSTEM_PROMPT = `Diseño de landing para e-commerce en formato historia 1080x1920.

Estilo hiperrealista, fotografía publicitaria profesional, composición rica en elementos visuales, profundidad de campo, iluminación cinematográfica.

Fondo negro elegante en toda la composición.

El producto debe verse extremadamente nítido y realista, con iluminación de estudio, reflejos suaves y sombras naturales.

Agregar elementos visuales modernos: degradados de luz, partículas brillantes, líneas de energía, figuras geométricas sutiles, destellos y efectos de profundidad.

Diseño dinámico, no plano.

Jerarquía tipográfica clara con:
- título grande
- subtítulo
- bullets cortos
- elementos de confianza
- precio en COP si aplica
- llamado a la acción si corresponde a la etapa AIDA

El producto debe ser el protagonista visual de la escena.

Respetar margen interno de 20 px en todos los bordes para evitar recortes.

Estilo premium de publicidad para e-commerce.

No caricaturas, no ilustración, solo estilo fotográfico hiperrealista.

Pensado para anuncios de Meta Ads y TikTok Ads.`;
```

## Próximos pasos

Una vez implementado este cambio, estarás listo para enviarme los **7 prompts específicos** para cada tipo de banner (Hook, Problema, Solución, Beneficio, Prueba Social, Oferta, CTA) y actualizaremos el objeto `templatePrompts`.
