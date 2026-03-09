

# Plan: Actualizar Prompt del Banner "CTA"

## Cambio a realizar

**Archivo**: `supabase/functions/generate-banner/index.ts`  
**Líneas**: 291-302 (clave `"cta"` en `templatePrompts`)

**Estado actual**: Prompt en inglés con composición básica de producto al 45-55%, botón CTA de máximo 3 palabras y mensaje final de máximo 6 palabras.

**Nuevo prompt**: Prompt en español detallado con:
- Invitación a tomar acción inmediata
- Producto en centro/abajo, nítido con iluminación de estudio
- Elementos de confianza: pago contra entrega, envíos nacionales, compra segura
- Botón CTA grande y llamativo en parte inferior
- Jerarquía: Título de acción (superior), Producto (centro), Confianza (debajo), Botón CTA (inferior)
- Ejemplo: "Pide el tuyo hoy mismo" + ✔ Pago contra entrega + Botón "QUIERO MI PRODUCTO"
- Clave psicológica: fácil, seguro, ahora

## Código

Reemplazar líneas 291-302 con:

```typescript
"cta": `Diseño de imagen para landing de e-commerce en formato vertical 1080x1920.

Estilo hiperrealista de fotografía publicitaria premium.

Fondo negro elegante con degradados luminosos y destellos suaves que transmitan una sensación de cierre de compra y energía positiva.

El producto aparece en el centro o ligeramente hacia abajo de la composición, extremadamente nítido, con iluminación de estudio y reflejos suaves que lo hagan destacar.

La escena debe transmitir claramente una invitación a tomar acción inmediata.

Agregar elementos visuales modernos como líneas luminosas, partículas brillantes y destellos sutiles que dirijan la atención hacia el botón de acción.

Composición dinámica y visualmente rica, con profundidad de campo y enfoque claro en el producto y el botón CTA.

Jerarquía tipográfica clara:
- Título grande en la parte superior invitando a comprar
- Debajo del producto incluir mensajes de confianza como: pago contra entrega, envíos a todo el país, proceso de compra fácil
- Botón visual grande en la parte inferior con el llamado a la acción, llamativo, moderno y fácil de leer

Mantener margen interno de 20 px en todos los bordes para evitar cortes.

Estilo completamente fotográfico hiperrealista, no caricatura ni ilustración.

Pensado para anuncios de Meta Ads y TikTok Ads.

ESTRUCTURA VISUAL:
- Parte superior: Título de acción (ej: "Pide el tuyo hoy mismo")
- Centro: Producto destacado
- Debajo: Elementos de confianza (✔ Pago contra entrega, ✔ Envíos a todo el país, ✔ Compra rápida y segura)
- Parte inferior: Botón CTA grande (ej: "QUIERO MI PRODUCTO")

CLAVE PSICOLÓGICA:
El usuario debe sentir que es fácil comprar, es seguro, y que debería hacerlo ahora.
Siempre funcionan: botón grande, pago contra entrega, envíos nacionales, mensaje simple.`,
```

## Estado final

Con este cambio, **todos los prompts de banners** estarán actualizados en español:
- ✅ Hook Visual
- ✅ Problema
- ✅ Solución
- ✅ Beneficio
- ✅ Prueba Social
- ✅ Oferta
- ✅ CTA ← este cambio

