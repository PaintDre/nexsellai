
# Plan: Actualizar Prompt del Banner "Beneficio"

## Cambio a realizar

**Archivo**: `supabase/functions/generate-banner/index.ts`  
**Líneas**: 157-167 (clave `"beneficio"` en `templatePrompts`)

**Estado actual**: Prompt en inglés enfocado en "one irresistible advantage" con producto al 50% del canvas

**Nuevo prompt**: Prompt en español detallado con:
- Persona disfrutando el resultado positivo del producto
- Producto visible e integrado naturalmente
- Título aspiracional + 3 beneficios en formato bullet
- Opcional: elementos de confianza (estrellas, mini testimonio)
- Estructura: Título (superior), Persona con resultado positivo (centro), 3 beneficios (lateral/inferior)
- Ejemplo: organizador de cables ("Tu espacio siempre ordenado")
- Clave psicológica: "Así se vería mi vida si tuviera esto"

## Código a implementar

Reemplazar líneas 157-167 con:

```typescript
"beneficio": `Diseño de imagen para landing de e-commerce en formato vertical 1080x1920.

Estilo hiperrealista de fotografía publicitaria premium.

Fondo negro elegante con degradados luminosos, destellos suaves y efectos de partículas que transmitan una sensación aspiracional y moderna.

La escena debe mostrar el BENEFICIO principal del producto en una situación positiva y deseable.

Una persona aparece disfrutando el resultado de usar el producto: comodidad, satisfacción, facilidad o mejora visible en su vida cotidiana.

El producto debe estar presente y claramente visible, integrado de forma natural dentro de la escena.

Iluminación cinematográfica con luces suaves que resalten el producto y la escena aspiracional.

Agregar elementos visuales modernos como brillos suaves, líneas de luz o iconos sutiles que refuercen visualmente los beneficios del producto.

Composición dinámica con profundidad de campo y enfoque claro en el resultado positivo.

Jerarquía tipográfica clara:
- Título grande en la parte superior destacando el beneficio principal
- Debajo o al lado del producto incluir 3 beneficios cortos en formato bullet
- Opcional: agregar pequeños elementos de confianza como estrellas de valoración o un mini testimonio corto

Mantener margen interno de 20 px en todos los bordes para evitar cortes.

Estilo completamente fotográfico hiperrealista, no caricatura ni ilustración.

Pensado para anuncios de Meta Ads y TikTok Ads.

ESTRUCTURA VISUAL:
- Parte superior: Título aspiracional
- Centro: Persona disfrutando el resultado
- Lateral o inferior: 3 beneficios claros

EJEMPLO DE REFERENCIA:
Si el producto fuera un organizador de cables:
Título: "Tu espacio siempre ordenado"
Beneficios:
✔ Escritorio limpio y organizado
✔ Instalación rápida en segundos
✔ Ideal para casa u oficina

CLAVE PSICOLÓGICA:
El usuario debe imaginar: "Así se vería mi vida si tuviera esto."
Las escenas funcionan mejor mostrando: tranquilidad, orden, comodidad, eficiencia, satisfacción.`,
```

## Próximos pasos

Quedarán 3 prompts por actualizar:
- Prueba Social
- Oferta
- CTA
