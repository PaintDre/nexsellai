

# Plan: Add Shopify Integration Tutorial Section to SaaS Landing

## Overview
Add a new "Cómo subir tu landing a Shopify en menos de 2 minutos" section after the "How it Works" section in `src/pages/Index.tsx`. This section will teach users step-by-step how to publish their generated landing pages to Shopify, reducing friction and increasing conversion.

## New Section Structure

**Section Location:** After "How it works" section (around line 183), before "Demo" section (line 185)

**Section Components:**

1. **Header**
   - Title: "Cómo subir tu landing a Shopify en menos de 2 minutos"
   - Intro text explaining that generated landings can easily be uploaded to Shopify stores without coding knowledge

2. **4-Step Visual Guide**
   - Use numbered cards (1-4) similar to existing "How it works" section
   - Each card includes:
     - Large number in primary color circle
     - Title (e.g., "Ir a tu panel de Shopify")
     - Short explanation
     - Icon placeholder for visual representation
   - Steps:
     1. Ir a tu panel de Shopify
     2. Online Store → Pages
     3. Crear una nueva página
     4. Pegar HTML y publicar

3. **Download Button Section**
   - Button: "Descargar landing para Shopify"
   - Supporting text: "Exporta tu landing como HTML listo para usar"

4. **Final CTA**
   - Heading: "Crea tu primera landing y publícala en Shopify hoy."
   - Button: "Probar generador gratis" (linking to demo)

## Design Consistency
- Reuse existing Card, CardContent, Button components
- Follow spacing: `py-20` for section padding
- Use grid layout: `md:grid-cols-4` for the 4-step cards
- Icons from lucide-react (FileUp, Settings, Plus, Send or similar)
- Match styling of "How it Works" section (centered layout, icon circles)
- Background: white (no background color to alternate with sections)

## Technical Implementation
- Add new JSX section between lines 183-184
- Import 4 additional lucide icons for step illustrations
- Use existing UI components (Card, CardContent, Button, Badge)
- No state changes needed
- No new components required

