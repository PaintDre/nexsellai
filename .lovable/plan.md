# Nexsell 2.0 — Roadmap de evolución (5 fases · 8–10 semanas)

Foco: **landing pública que venda** + **suite IA pro** (video desde foto de producto, influencers/avatares IA, agentes que orquestan todo). Mantenemos identidad Emerald/Navy, pero la evolucionamos: nueva paleta extendida, tipografía y secciones que comuniquen claramente qué puede hacer un dropshipper con Nexsell.

---

## Nota sobre "HighField"

No encuentro un proveedor llamado **HighField** en mi catálogo de conectores ni en la web como API de avatares/video. Lo más probable es que te refieras a uno de estos:

- **HeyGen** → avatares hablando, influencers IA, lipsync, traducción de video. Está disponible como conector MCP en Lovable.
- **Hedra** → avatares cantando/hablando desde foto + audio.
- **Higgsfield** → modelo de video con cámara cinematográfica controlable (Soul, DoP).

**Antes de Fase 3 te confirmo cuál es.** El plan está armado de forma que el proveedor de video/avatar es intercambiable (todo pasa por edge function `generate-video-ai`).

---

## Fase 1 · Nueva Landing Pública de Venta (semana 1–2)

**Objetivo:** convertir visitas frías en signups. Hoy la landing no comunica con claridad qué hace ni para quién.

Estructura nueva (10 secciones, mobile-first):

1. **Hero** con video loop (producto real generándose → landing terminada en 8 seg) + headline orientado a dropshippers
2. **"En 60 segundos tienes tu landing"** — demo interactivo (3 inputs → preview)
3. **Para quién es** — 3 cards: Dropshipper, Tienda Shopify, Marca emergente
4. **Cómo funciona** — 4 pasos animados (Producto → IA Copy → Banner → Publicar)
5. **Showcase real** — grid 6–8 landings generadas (jala de `landings` con flag `featured`)
6. **Comparativa** — "Sin Nexsell vs Con Nexsell" (tiempo, costo, conversión)
7. **Casos de éxito** — 3 testimonios con métricas reales
8. **Pricing** rediseñado con toggle mensual/anual + badge "más vendido"
9. **FAQ** (10 preguntas dropshipper-focused)
10. **CTA final** + footer pro

Entregables:

- Direcciones visuales (3 opciones rendered) → eliges → construyo
- Nueva paleta extendida (Emerald base + acentos cálidos para CTAs)
- Tipografía revisada (probable: **Geist** display + **Inter** body, o **Space Grotesk** + **DM Sans**)
- 8–12 imágenes nuevas (hero, mockups, ilustraciones de proceso) generadas con Gemini 3 Pro Image
- Copy nuevo en ES (orientado a "dropshippers LATAM que quieren vender más sin pelearse con diseño")
- SEO: title/meta/OG/JSON-LD + `llms.txt`

---

## Fase 2 · Onboarding + Dashboard claro (semana 3)

Sin esto, los nuevos signups de Fase 1 se pierden.

- **Tour de 3 pasos** post-confirmación (Welcome → Crea producto → Genera primera landing)
- **Dashboard rediseñado**: stats arriba (landings, banners restantes, visitas), CTA principal "Crear nueva landing", últimas 4 landings con preview
- **Empty states** ilustrados (en lugar de mensajes secos)
- **Tooltips contextuales** explicando cada generación IA y cuántos créditos consume
- Microcopy en español pulido en toda la app

---

## Fase 3 · Suite IA pro — Video desde foto del producto (semana 4–5)

**El feature estrella.** Subes una foto de producto → IA genera un video de 5–10 seg listo para Instagram/TikTok/Shopify.

Pipeline:

1. **Edge function `generate-product-video**` recibe `product_id` + `style` (unboxing, showcase, lifestyle, problema-solución)
2. **Paso A** — Gemini 3 Pro analiza la foto y genera un guión visual (escenas, ángulos, movimiento de cámara)
3. **Paso B** — Modelo de video (Higgsfield/Veo/Kling vía Lovable AI Gateway, o tu API HighField si confirmas) genera el clip
4. **Paso C** — Subimos a bucket `product-videos` + registramos en tabla nueva `product_videos` (con campos `style`, `duration`, `credits_charged`, `status`)
5. **UI** — Nueva sección "Videos" en sidebar con galería, regenerar, descargar MP4, compartir directo a WhatsApp/IG

Cobertura de créditos:

- Plan Free: 0 videos/mes
- Plan Pro: 5 videos/mes
- Plan Business: 20 videos/mes
- Configurables en `system_config`

---

## Fase 4 · Influencers IA + Avatares hablando (semana 6–7)

Si confirmas HeyGen/Hedra:

- **Generador de "influencer IA"**: el usuario elige género/edad/estilo → creamos avatar persistente por usuario (tabla `ai_avatars`)
- **Script-to-video**: el avatar lee el copy de la landing (gancho + CTA) en español neutro, mexicano o argentino
- **Lipsync** sobre la foto del producto (formato vertical 9:16)
- **Biblioteca de hooks** pre-escritos por la IA (50 ganchos virales para dropshipping) que el avatar puede leer
- Se integra al editor de landing como bloque nuevo: **Video Hero con Avatar**

Si no usamos HeyGen, esta fase se reemplaza por:

- **Pack de templates de video sin avatar**: text-to-video con b-roll generado + voiceover (ElevenLabs vía conector)

---

## Fase 5 · Agentes IA orquestadores + crecimiento del SaaS (semana 8–10)

El paso de "herramienta" a "co-piloto":

- **Agente "Lanzador"**: en un solo prompt el usuario dice *"vendo gorras térmicas a mujeres 25–45 en México"* → el agente genera producto + landing + 3 banners + 1 video + texto para anuncio Meta/TikTok
- Implementado con AI SDK + tool calling (`stepCountIs(50)`), 6 tools: `createProduct`, `generateLanding`, `generateBanner`, `generateVideo`, `generateAd`, `publishToShopify`
- **Panel de "Campañas"** que agrupa todo lo generado en una unidad vendible
- **Analytics consolidado**: vistas + CTR + conversión por campaña
- **Sistema de referidos** + códigos de descuento (crecimiento)
- **Email marketing automatizado**: secuencia de 5 emails post-signup (ya tenemos infra, falta contenido)

---

## Detalles técnicos

**Tablas nuevas:**

- `product_videos` (id, user_id, product_id, video_url, style, duration_sec, provider, credits_charged, status, created_at)
- `ai_avatars` (id, user_id, provider_avatar_id, preview_url, voice_id, language, created_at)
- `campaigns` (id, user_id, name, product_id, landing_id, banner_ids[], video_ids[], status, created_at) — Fase 5
- `featured_landings` flag en tabla `landings` para showcase de Fase 1

Todas con GRANTs + RLS por `user_id = auth.uid()` y políticas para `super_admin`.

**Edge functions nuevas:**

- `generate-product-video` (Fase 3)
- `generate-avatar-video` (Fase 4, si HeyGen)
- `agent-campaign-launcher` (Fase 5, con tool calling y `stepCountIs(50)`)

**Modelos IA:**

- Texto/copy/scripts: `google/gemini-3-flash-preview` (default) y `gemini-3.1-pro-preview` para Fase 5 agente
- Imágenes: `google/gemini-3-pro-image-preview` (calidad) y `gemini-3.1-flash-image-preview` (volumen)
- Video: a confirmar tras aclaración de "HighField"

**Seguridad:**

- Todas las claves server-side (LOVABLE_API_KEY, y la de HighField/HeyGen si aplica)
- Rate-limit por usuario y por plan en cada edge function
- Logs de uso en `credit_transactions` con acción específica (`video_generation`, `avatar_generation`, `agent_campaign`)

**Restricciones que aplicaré (como pediste):**

- Free no genera video ni avatares
- Avatares: máx 1 por usuario en Pro, 3 en Business
- Videos: máx 30 seg de duración total
- Influencers IA limitados al tono profesional (sin contenido sensible)

---

## Qué necesito de ti antes de empezar

1. **Confirmar qué es "HighField"** (HeyGen / Hedra / Higgsfield / otro) y tener la API key lista para guardarla como secret cuando lleguemos a Fase 3
2. **Aprobar este plan** (o pedir cambios de orden/alcance)
3. **Confirmar** que arranco Fase 1 mostrándote 3 direcciones visuales de la nueva landing

Cuando apruebes el plan paso a build mode y empiezo por Fase 1.  
  
1.[higgsfield.ai](http://higgsfield.ai) esa es la web que esperas  
donde te dejo la api key  
2. como podria pedir cambios porque quiero que trabajes con el link que te pase.  
3. arranquemos desde el inicio para que todo fluya bien.

&nbsp;