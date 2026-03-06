

# Plan: Sistema de Banners Flexible (Sin hardcodear modelo de negocio)

## Problema actual

Los prompts de generación de banners están hardcodeados con elementos específicos de dropshipping chileno:
- "🚚 Envío Gratis" y "💰 Pago Contraentrega" en TODOS los templates
- Texto forzado en español con frases específicas ("¿Te pasa esto?", "¿Cansado de...?")
- Badges de confianza fijos ("Entrega 24-48h", "Garantía 30 días")
- Moneda fija "CLP"

Esto limita a usuarios con otros modelos de negocio (servicios, SaaS, productos digitales, tiendas con otras políticas de envío, otros países).

## Solución

Agregar un paso de **configuración de negocio** en el wizard de banners donde el usuario define qué información mostrar, y pasar esa configuración al prompt de forma dinámica.

### Cambios

#### 1. `src/pages/GenerateBanner.tsx` — Agregar step de configuración

Agregar campos opcionales en el Step 2 (Descripción) o como sub-sección:
- **Moneda** (select): CLP, USD, EUR, MXN, COP, ARS, o texto libre
- **Badges de confianza** (checkboxes opcionales):
  - Envío gratis
  - Pago contraentrega  
  - Garantía (con input de días)
  - Entrega rápida (con input de tiempo)
  - Compra segura
  - Custom (texto libre)
- **Slogan/texto personalizado** (textarea opcional, ya existe `customText`)
- **Estilo de comunicación** (select): Urgente/Agresivo, Profesional/Sobrio, Casual/Amigable

Esto se pasa como `businessConfig` al edge function.

#### 2. `supabase/functions/generate-banner/index.ts` — Prompts dinámicos

- Recibir `businessConfig` del request body
- Reemplazar los badges hardcodeados por los que el usuario seleccionó
- Formatear precio con la moneda elegida (no forzar CLP)
- Hacer que los textos sugeridos en los prompts sean genéricos (no forzar frases específicas)
- Si no se envía `businessConfig`, usar defaults actuales (retrocompatibilidad)

#### 3. `src/components/banner/templates.ts` — Sin cambios estructurales

Los templates definen etapas del funnel, no el contenido de negocio. Se mantienen como están.

### Detalle del flujo

**Step 2 actual** ("Describe tu producto") se expande con una sección colapsable "Configuración de negocio":

```
┌─────────────────────────────────┐
│ Describe tu producto            │
│ [textarea actual]               │
│                                 │
│ ▼ Configuración del banner      │
│ ┌─────────────────────────────┐ │
│ │ Moneda: [CLP ▼]            │ │
│ │                             │ │
│ │ Badges a mostrar:           │ │
│ │ ☑ Envío gratis              │ │
│ │ ☑ Pago contraentrega        │ │
│ │ ☐ Garantía [__ días]        │ │
│ │ ☐ Entrega rápida [__ hrs]   │ │
│ │ ☐ Compra segura             │ │
│ │ ☐ Personalizado [_______]   │ │
│ │                             │ │
│ │ Tono: [Urgente ▼]          │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Cambio en prompts (ejemplo)

**Antes:**
```
- Trust badges subtly integrated: "🚚 Envío Gratis" "💰 Pago Contraentrega"
```

**Después:**
```
- Trust badges to include: ${badges.join(", ") || "None specified"}
- Communication tone: ${tone}
```

**Precio antes:** `$${price.toLocaleString("es-CL")} CLP`
**Precio después:** `${currencySymbol}${formattedPrice} ${currencyCode}`

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/GenerateBanner.tsx` | Agregar sección de config de negocio en Step 2, pasar `businessConfig` al invoke |
| `supabase/functions/generate-banner/index.ts` | Recibir `businessConfig`, hacer prompts dinámicos, formatear precio flexible |

### Retrocompatibilidad

Si `businessConfig` no se envía (banners generados desde landing pages u otros flujos), se usan los defaults actuales: CLP, envío gratis, pago contraentrega.

