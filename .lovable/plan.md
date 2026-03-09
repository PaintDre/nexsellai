
# Plan: Actualizar Prompt del Banner "Problema"

## Cambio a realizar

**Archivo**: `supabase/functions/generate-banner/index.ts`  
**Líneas**: 70-80 (clave `"problema"` en `templatePrompts`)

**Estado actual**: Prompt en inglés genérico enfocado en "emotional connection" y "empathetic headline"

**Nuevo prompt**: Prompt en español detallado con:
- Persona enfrentando el problema como foco principal
- Expresión de incomodidad/frustración natural
- Producto secundario o insinuado
- Jerarquía: Título del problema + Subtítulo que intensifique el dolor
- Estructura: Título (superior), Persona con problema (centro), Subtítulo (inferior)
- Ejemplo: corrector de postura ("¿Pasas horas con dolor de espalda?")
- Clave psicológica: El usuario debe pensar "Ese soy yo"

## Código a implementar

Reemplazar líneas 70-80 con:

```typescript
"problema": `Diseño de imagen para landing de e-commerce en formato vertical 1080x1920.

Estilo hiperrealista de fotografía publicitaria profesional.

Fondo negro elegante con degradados suaves y ligeros destellos de luz para mantener un estilo premium.

La escena debe mostrar claramente el PROBLEMA que experimenta el cliente al no tener el producto.

Una persona aparece enfrentando la dificultad o frustración relacionada con el problema principal del producto. La expresión debe transmitir incomodidad, dificultad o frustración de manera natural y realista.

El producto puede aparecer de forma secundaria o insinuada, pero el foco visual principal es el problema.

Iluminación cinematográfica con sombras suaves y profundidad de campo para generar dramatismo.

Agregar elementos visuales sutiles como líneas de energía, partículas de luz o iconos pequeños que refuercen visualmente el problema.

Composición dinámica y visualmente rica, no plana.

Jerarquía tipográfica clara:
- Título grande en la parte superior que describa el problema del cliente
- Subtítulo corto que refuerce la frustración o dificultad que genera ese problema

Mantener márgenes internos de 20 px en todos los bordes para evitar cortes.

Estilo completamente fotográfico e hiperrealista, no ilustración ni caricatura.

Pensado para anuncios de Meta Ads y TikTok Ads.

ESTRUCTURA VISUAL:
- Parte superior: Título del problema
- Centro: Persona enfrentando el problema
- Parte inferior: Subtítulo corto que intensifique el dolor

EJEMPLO DE REFERENCIA:
Si el producto fuera un corrector de postura:
Título: "¿Pasas horas con dolor de espalda?"
Subtítulo: "La mala postura puede afectar tu día a día."

CLAVE PSICOLÓGICA:
La escena debe mostrar una situación con la que el cliente se identifique inmediatamente: frustración, incomodidad, pérdida de tiempo, dificultad, desorden, cansancio.
El usuario debe pensar: "Ese soy yo."`,
```

## Próximos pasos

Una vez implementado, quedarán 4 prompts por actualizar:
- Beneficio
- Prueba Social
- Oferta
- CTA
