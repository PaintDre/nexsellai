# Plan de Ejecución — Sprint 1: Pipeline IA v2 + Calidad de Landings

## Objetivo del Sprint

Elevar la calidad del copy y diseño de las landings generadas con un pipeline IA expandido y bloques nuevos, dejando la base lista para Sprint 2 (editor canvas) y Sprint 3 (bridge Shopify nativo).

## Alcance

### 1. Pipeline IA v2 en `generate-landing`

Reemplazar el flujo actual por una secuencia de 5 pasos:

```text
Input (producto + audiencia + intensidad + offer)
   │
   ▼
[1] Market Research  →  gemini-3-flash-preview
   │   (insights de categoría, dolores, lenguaje del cliente, objeciones)
   ▼
[2] Strategy         →  gpt-5-mini
   │   (ángulo de venta, promesa, hook principal, orden de bloques AIDA)
   ▼
[3] Blocks v2        →  gemini-3-flash-preview
   │   (genera bloques con _meta, copy, CTAs, variantes A/B)
   ▼
[4] Critic           →  gpt-5.2
   │   (revisa claridad, fricción, longitud, prohíbe precios hardcodeados)
   ▼
[5] Polish           →  gpt-5-mini
       (aplica fixes del crítico, devuelve JSON final validado con Zod)
```

- Cada paso loguea tiempo y tokens para métricas.
- Si Critic detecta errores graves, Polish reintenta con feedback (máx. 1 reintento).
- Output final compatible con `LandingRenderer` actual (no rompe landings existentes).

### 2. Prompt packs por categoría

Nuevo `key` en `system_config`: `landing_prompt_packs`.

- Pack por categoría existente (`home`, `fitness`, `beauty`, `gadget`, `pets`) con:
  - tono de voz
  - palabras prohibidas
  - estructura recomendada de bloques
  - ejemplos de hooks
- El edge function lee el pack según `product.category` y lo inyecta en Strategy + Blocks.
- Editable desde `SuperAdminConfig` (ya existe la UI para system_config).

### 3. Nuevos bloques en `LandingRenderer`

Agregar render para tipos nuevos que el IA podrá usar:

- `social_proof_carousel` — testimonios en carrusel con avatar + estrellas
- `comparison_table` — "nosotros vs. competencia"
- `urgency_bar` — barra superior con countdown/stock
- `sticky_cta` — CTA pegado abajo en mobile
- `before_after` — ya existe `BeforeAfterSlider`, integrar como bloque
- `bundle_offer` — combo con precio tachado (sin hardcodear, usa `product.price`)

Cada bloque respeta el theme actual y `object-contain` en imágenes.

### 4. Validación estricta de output

- Esquema Zod en `generate-landing` que valida cada bloque antes de guardar.
- Si falla validación → reintento con Polish, si vuelve a fallar → error claro al usuario.
- Strip automático de `_meta` antes de guardar en DB (ya documentado en memory).

### 5. Métricas básicas

Nuevo evento en `credit_transactions.metadata`:

- `pipeline_version: "v2"`
- `generation_time_ms`
- `critic_issues_count`
- `retries`

Permite medir mejora vs pipeline actual sin tabla nueva.

## Lo que NO se toca en este sprint

- Editor canvas drag-and-drop → Sprint 2
- Bridge Shopify producto/sección → Sprint 3
- Banners → fase posterior
- Schema de DB (nada de migraciones, sólo `system_config` insert)

## Detalles técnicos

**Archivos a modificar:**

- `supabase/functions/generate-landing/index.ts` — reescritura del pipeline
- `supabase/functions/_shared/` — nuevo `landing-prompts.ts` con prompt packs y helpers de pasos
- `src/components/landing/LandingRenderer.tsx` — render de 6 bloques nuevos
- `src/components/landing/themes.ts` — verificar que los nuevos bloques heredan tokens
- Migración SQL: `INSERT INTO system_config (key, value)` para `landing_prompt_packs`

**Modelos via Lovable AI Gateway** (sin API key extra):

- `google/gemini-3-flash-preview` — research + blocks (rápido, barato)
- `openai/gpt-5-mini` — strategy + polish (balance)
- `openai/gpt-5.2` — critic (precisión)

**Compatibilidad:**

- Landings existentes siguen renderizándose igual.
- Si el IA devuelve sólo bloques viejos, todo funciona.
- `template_id` y `theme` actuales se mantienen.

## Verificación al terminar

1. Generar una landing de prueba con cada categoría desde `/products/:id/generate`.
2. Confirmar que aparecen al menos 2 bloques nuevos.
3. Revisar logs de `generate-landing` que muestran los 5 pasos.
4. Validar que el render no rompe en mobile (375px) ni desktop.
5. Verificar `credit_transactions.metadata.pipeline_version === "v2"`.

## Estimación

~4–6 horas de trabajo del agente, una sola tanda. Te aviso al terminar para que pruebes generando una landing real.

## Pregunta antes de arrancar

**suave** (sólo sugiere mejoras y Polish las aplica sin bloquear)? Recomiendo **suave** para no aumentar tiempo de generación en >40s.  
  
ademas de eso [https://readdy.ai/landing/website-builder?utm_id=23810024593&utm_source=google&utm_medium=cpc&utm_content=&utm_term=_&utm_adgroup=&gad_source=1&gad_campaignid=23805587495&gbraid=0AAAABAld9b35VlNAh-zfBKZ4GURSVuq1k&gclid=CjwKCAjw8arQBhB9EiwAfIKdQrjRbRjyICmefzobkU-H5BJ9zwILhb9gacNTOWzPWXoT2MLd2RI3bBoCMooQAvD_BwE](https://readdy.ai/landing/website-builder?utm_id=23810024593&utm_source=google&utm_medium=cpc&utm_content=&utm_term=_&utm_adgroup=&gad_source=1&gad_campaignid=23805587495&gbraid=0AAAABAld9b35VlNAh-zfBKZ4GURSVuq1k&gclid=CjwKCAjw8arQBhB9EiwAfIKdQrjRbRjyICmefzobkU-H5BJ9zwILhb9gacNTOWzPWXoT2MLd2RI3bBoCMooQAvD_BwE) investiga esa web y revisala para ver si hacemos el mismo servicio para que apliquemos algunas ideas

&nbsp;