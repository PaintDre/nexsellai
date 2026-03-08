
# Plan: Actualización del Prompt Base

He recibido tu **Prompt Base**. Es excelente, ya que define un estilo muy claro (hiperrealista, fondo negro, iluminación cinematográfica, elementos modernos, jerarquía AIDA) y evita ambigüedades.

Voy a reemplazar el `SYSTEM_PROMPT` actual de la Edge Function (`generate-banner`) con tu nueva instrucción. 

### El cambio a realizar será el siguiente:

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

### Siguientes pasos:

Si apruebas este plan, actualizaré el código base con este nuevo `SYSTEM_PROMPT`. 

Mientras tanto o después de aprobar, **puedes enviarme los prompts específicos para los 7 tipos de banners** (Hook, Problema, Solución, Beneficio, Prueba Social, Oferta, CTA) para que actualicemos también la variable `templatePrompts` y completar la modificación de todo el agente.
