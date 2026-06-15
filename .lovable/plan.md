# Fase 5 — Agente Lanzador todo-en-uno (dividida)

Un solo botón "Lanzar Campaña" que orquesta: Producto → Banners → Video → Influencer → Kit descargable. Cada sub-fase es independiente, testeable y con checkpoint antes de avanzar.

---

## Arquitectura general

Nueva tabla `launch_jobs` para trackear el progreso de cada lanzamiento:

- `id`, `user_id`, `product_id`
- `status` (pending, running, completed, failed)
- `current_step` (product, banners, video, influencer, kit)
- `steps_completed` (jsonb: `{product: true, banners: true, ...}`)
- `assets` (jsonb con URLs de cada output)
- `error_message`, `created_at`, `updated_at`

Edge function orquestadora `launch-campaign` que llama secuencialmente a las funciones existentes y actualiza el job.

UI nueva en `/launcher`: card del producto, botón grande "Lanzar", stepper visual con 5 pasos, logs en vivo vía realtime.

---

## Sub-fase 5.1 — Setup base + selección de producto

**Qué construir:**

- Migración `launch_jobs` (con GRANT + RLS por user_id)
- Página `/launcher` con lista de productos del usuario
- Selector de producto + preview de la info que se usará

**Checkpoint 5.1:**

- Entras a `/launcher`, ves tus productos, seleccionas uno, ves un preview con foto/nombre/descripción.
- Aún no hay generación.

---

## Sub-fase 5.2 — Step 1: Producto validado + banners

**Qué construir:**

- Botón "Generar Banners" que crea un `launch_job` y llama a la función existente de banners
- Stepper visual marca step "Producto" ✅ y "Banners" en progreso
- Al terminar, muestra los banners generados dentro del flujo

**Checkpoint 5.2:**

- Click → ves 3-5 banners generados ligados al job.
- Si falla → refund de créditos y mensaje de error claro.

---

## Sub-fase 5.3 — Step 2: Video del producto

**Qué construir:**

- Después de banners OK, botón "Generar Video"
- Llama a la edge function existente de video con la foto principal del producto
- Guarda URL del video en `launch_jobs.assets.video_url`

**Checkpoint 5.3:**

- Video aparece reproducible en la UI dentro del stepper.
- Job tiene `steps_completed.video = true`.

---

## Sub-fase 5.4 — Step 3: Influencer hablando

**Qué construir:**

- Form mínimo: script (texto) + selector de voz (masc/fem) + idioma
- Integración TTS (ElevenLabs vía secret nuevo, o Lovable AI si soporta TTS) → genera mp3
- mp3 + foto del influencer → `generate-influencer-video` (ya existe)
- Guarda URL final en `launch_jobs.assets.influencer_url`

**Checkpoint 5.4:**

- Subes foto, escribes script, eliges voz → obtienes video del influencer hablando.
- Si TTS falla, opción de subir audio propio sigue disponible.

---

## Sub-fase 5.5 — Step 4: Kit descargable

**Qué construir:**

- Edge function `build-launch-kit` que arma un ZIP con: banners (PNG), video producto (mp4), video influencer (mp4), `copy.txt` con título/descripción/CTA
- Sube ZIP a bucket `dropi-ads` y devuelve URL firmada
- Botón "Descargar Kit" en la UI

**Checkpoint 5.5:**

- Descargas un .zip con todos los assets listos para subir a Meta/TikTok Ads.
- Job queda `status = completed`.

---

## Detalles técnicos

- **Créditos:** cada sub-fase cobra al inicio con `charge_credits` y hace `refund_credits` si falla. Costo total estimado se muestra antes del lanzamiento.
- **Realtime:** suscripción a `launch_jobs` por id para actualizar el stepper sin polling.
- **Reintentos:** si una sub-fase falla, botón "Reintentar este paso" sin rehacer lo anterior.
- **Secrets nuevos posibles:** `ELEVENLABS_API_KEY` (solo si confirmas TTS con ElevenLabs).

---

## Orden de implementación recomendado

1. 5.1 (setup + UI base) — pruebas
2. 5.2 (banners) — pruebas
3. 5.3 (video) — pruebas
4. 5.4 (influencer + TTS) — pruebas
5. 5.5 (kit ZIP) — pruebas finales end-to-end

Cada checkpoint = me avisas "OK" y avanzo al siguiente. Si algo falla, debug antes de continuar.  
indicame en cada vez que pasemos a otro paso para que yo pueda ver donde debo ir y que probar o ver 