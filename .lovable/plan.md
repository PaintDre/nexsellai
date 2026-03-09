
# Plan: Actualizar Prompt del Banner "Oferta"

## Cambio a realizar

**Archivo**: `supabase/functions/generate-banner/index.ts`  
**Líneas**: 245-255 (clave `"oferta"` en `templatePrompts`)

**Estado actual**: Prompt en inglés enfocado en presentar precio de forma prominente con elementos de urgencia opcionales.

**Nuevo prompt**: Prompt en español detallado con:
- Transmitir claramente oferta especial o promoción activa
- Producto en el centro, nítido, iluminado con estudio
- Elementos visuales de promoción: destellos, líneas luminosas, badges de oferta
- Jerarquía: Título de promoción (superior), Producto + badge de precio en COP (centro), Texto de urgencia (inferior)
- Ejemplo: "Oferta especial por tiempo limitado" + $89.900 COP + "Promoción válida hasta agotar stock"
- Clave psicológica: Activa escasez y oportunidad → "Si lo voy a comprar, mejor ahora"

## Código a implementar

Reemplazar líneas 245-255 con el nuevo prompt en español que incluye estructura visual, ejemplo de referencia y gatillos psicológicos de escasez y oportunidad.

## Próximo paso

Quedará 1 prompt por actualizar: **CTA**
