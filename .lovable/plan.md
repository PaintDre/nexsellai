
# Plan: Actualizar Prompt del Banner "Prueba Social"

## Cambio a realizar

**Archivo**: `supabase/functions/generate-banner/index.ts`  
**Líneas**: 203-214 (clave `"prueba-social"` en `templatePrompts`)

**Estado actual**: Prompt en inglés enfocado en mostrar producto al 40-50% con rating de 5 estrellas, contador de clientes y testimonio corto de máximo 10 palabras.

**Nuevo prompt**: Prompt en español detallado con:
- Transmitir confianza y validación social
- Producto visible con elementos de satisfacción de clientes (reseñas, estrellas, testimonios)
- Iluminación de estudio con sombras suaves
- Opcional: persona usando el producto con satisfacción
- Jerarquía: Título de confianza (superior), Producto + cliente satisfecho (centro), Estrellas + testimonio + indicador de popularidad (debajo)
- Ejemplo: "Clientes que ya lo probaron lo recomiendan" + ⭐⭐⭐⭐⭐ 4.8/5 + testimonio corto
- Clave psicológica: "Las personas compran cuando sienten que no están tomando el riesgo solos"

## Código a implementar

Reemplazar líneas 203-214 con:

```typescript
"prueba-social": `Diseño de imagen para landing de e-commerce en formato vertical 1080x1920.

Estilo hiperrealista de fotografía publicitaria premium.

Fondo negro elegante con degradados suaves y destellos sutiles para mantener coherencia visual con las imágenes anteriores.

La escena debe transmitir confianza y validación social del producto.

Mostrar el producto en un entorno realista acompañado de elementos que representen la satisfacción de clientes: reseñas positivas, calificaciones con estrellas, mini testimonios o indicadores de popularidad.

El producto aparece claramente visible y bien iluminado con iluminación de estudio y sombras suaves.

Opcional: incluir una persona usando el producto con expresión de satisfacción o mostrando el resultado positivo.

Agregar elementos visuales modernos como brillos suaves, pequeñas estrellas luminosas o iconos sutiles que refuercen la idea de calidad y confianza.

Composición dinámica y visualmente rica, con profundidad de campo y enfoque claro en el producto.

Jerarquía tipográfica clara:
- Título grande en la parte superior que refuerce la confianza del producto
- Debajo del producto incluir: calificación visual con estrellas, un mini testimonio corto, un indicador de popularidad (ej: miles de clientes satisfechos)

Mantener margen interno de 20 px en todos los bordes para evitar cortes.

Estilo completamente fotográfico hiperrealista, no caricatura ni ilustración.

Pensado para anuncios de Meta Ads y TikTok Ads.

ESTRUCTURA VISUAL:
- Parte superior: Título de confianza
- Centro: Producto + cliente satisfecho o escena de uso
- Debajo: ⭐⭐⭐⭐⭐ + "Me sorprendió la calidad, lo uso todos los días" + "Más de 5.000 clientes satisfechos"

EJEMPLO DE REFERENCIA:
Título: "Clientes que ya lo probaron lo recomiendan"
Testimonio corto: "Llegó rápido y funciona perfecto."
Calificación: ⭐⭐⭐⭐⭐ 4.8/5

CLAVE PSICOLÓGICA:
Las personas compran cuando sienten que no están tomando el riesgo solos.
Funcionan muy bien: ⭐ estrellas, 🧾 mini reseñas, 👥 número de clientes, 📦 pedidos entregados.`,
```

## Próximos pasos

Quedarán 2 prompts por actualizar:
- Oferta
- CTA
