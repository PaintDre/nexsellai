

# Completar los 2 puntos faltantes del prompt

## Cambios en `supabase/functions/generate-landing/index.ts`

### 1. Feature gating para product landings (contexto A)
Agregar instrucción después de las plan rules para que en TODOS los product landings (no solo Pro) se incluya un bloque `microcopy` con trust signals y notas de checkout.

### 2. SaaS demo flow detallado (contexto B)
Expandir la sección `saas_demo` para incluir los detalles específicos:
- El usuario puede probar sin crear cuenta con límites free
- No puede exportar/descargar hasta crear cuenta
- Una vez creada la cuenta, export disponible según plan

Ambos cambios son solo texto dentro del `systemPrompt` string. Sin cambios en lógica, base de datos ni archivos adicionales.

