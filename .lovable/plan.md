
El usuario pide explicación, no implementación. Le doy el flujo completo paso a paso de cómo se crea una landing page en Nexsell.

# Cómo se crea una landing page en Nexsell — paso a paso

## Punto de entrada
Ruta: `/products/:id/generate-landing` → componente `src/pages/GenerateLanding.tsx`. El usuario llega tras seleccionar un producto.

## Paso 1 — Carga del producto (frontend)
Al montar la página, un `useEffect` consulta el producto en la tabla `products` filtrando por `id` y `user_id` (RLS). Si no existe o falla, redirige a `/products`. Si existe, llena el estado `product` que alimenta toda la pantalla.

## Paso 2 — Configuración del usuario
El usuario elige entre dos modos:
- **Quick Mode (⚡)**: usa defaults (template "completa", intensidad media, sin oferta, garantía 30 días, autoImages activo si el plan es pago).
- **Custom Mode (🎛️)**: permite elegir template (Completa / Rápida / Social Proof / Educativa), intensidad (soft/medium/hard), oferta on/off, tema visual (Minimal/Bold/Clean/Warm), texto de garantía, y si genera imágenes IA.

También se valida el límite del plan (`landings_used` vs límite por plan: free=1, starter=10, pro=100). Si está agotado, bloquea la generación y muestra modal de upgrade.

## Paso 3 — Disparo: `handleGenerate`
Al hacer clic en "Generar":
1. Setea `generating=true`, `generationStep="copy"`, progreso 10%.
2. Invoca la Edge Function `generate-landing` con: `product`, `mode`, `intensity`, `hasOffer`, `guarantee`, `plan`, `sections` del template, `currency` y `country_code` del perfil.

## Paso 4 — Edge Function `generate-landing` (pipeline de 3 etapas con OpenAI gpt-4o-mini)

**4.1 Planner (Strategist)** — temperatura 0.6
- Recibe el producto y devuelve una `Strategy` JSON: `primary_angle`, `tone`, `persuasion_level`, `awareness_level`, `key_objections`, `section_emphasis`, `category_context`, `risky_blocks` (bloques sin datos reales para usar copy seguro).
- Si falla, usa `getDefaultStrategy()` como fallback.

**4.2 Generator (Copywriter)** — temperatura más alta para creatividad
- Construye un prompt enorme que incluye: estrategia del planner, instrucción de idioma según `country_code` (AR voseo, CL, MX, BR portugués, etc.), reglas según el plan (free=3 bloques, starter=8, pro=13), reglas de seguridad (no inventar testimonios, no precios falsos, no stocks específicos), contexto SaaS si aplica.
- Devuelve `{ blocks: [...] }` con los bloques tipados (`hero`, `benefits`, `features`, `testimonials`, `objections`, `faq`, `offer`, `urgency`, `guarantee`, `microcopy`, `cta`, etc.) cada uno con `type`, `title`, `content`, `order`, opcionalmente `_meta`.

**4.3 Critic (QA Editor)** — temperatura baja
- Toma los bloques y los pule: elimina repeticiones, suaviza urgencia falsa, ajusta claims, mejora CTA, asegura tono consistente, mantiene el formato exacto.
- Devuelve los mismos bloques refinados.

## Paso 5 — Persistencia (frontend)
Con los `blocks` finales, el frontend hace `INSERT` en la tabla `landings` con: `user_id`, `product_id`, `name`, `mode`, `intensity`, `has_offer`, `guarantee`, `blocks` (JSONB), `theme`. Recibe el `insertedLanding` con su `id`.

## Paso 6 — Generación de banners IA (opcional, solo planes Starter/Pro)
Si `autoImages` está activo:
1. Setea `generationStep="images"`, progreso 65%.
2. Resuelve URLs públicas absolutas de las imágenes del producto desde el bucket `product-images`.
3. Identifica bloques clave: `hero`, `benefits`, `offer` (o `cta` como fallback).
4. En paralelo (`Promise.all`) invoca la Edge Function `generate-banner` para cada uno con: producto, template (`hero-producto`, `beneficios-grid`, `oferta-directa`), tamaño 1200x628, `landingId`, contenido del bloque.
5. Esa función usa Google Gemini para hacer image-to-image "Product-First" (extrae color/textura del producto real).

## Paso 7 — Cierre
1. Incrementa `landings_used` en el perfil del usuario.
2. Progreso 100%, `generationStep="done"`, toast de éxito.
3. Tras 800ms redirige a `/landings/:id` (el editor/visualizador).

## Resultado final
Un registro en la tabla `landings` con:
- **Bloques JSON** estructurados y validados (3 a 13 según plan)
- **Tema visual** persistido (Minimal/Bold/Clean/Warm)
- **Banners IA** asociados por sección (si plan pago + autoImages)
- **Slug público** generable para URL `/p/:slug`
- **Editable inline** vía contentEditable
- **Versionable** (hasta 20 versiones automáticas)
- **Exportable** a Shopify (Liquid/JSON o ZIP)

## Diagrama del flujo

```text
User → GenerateLanding.tsx
        │
        ├─ Carga producto (Supabase: products)
        ├─ Configura (template, intensity, theme, autoImages)
        │
        ▼ handleGenerate()
        │
        ├─ Edge Fn: generate-landing
        │     ├─ 1. Planner  (OpenAI) → Strategy
        │     ├─ 2. Generator (OpenAI) → Blocks
        │     └─ 3. Critic   (OpenAI) → Blocks refinados
        │
        ├─ INSERT en tabla `landings`
        │
        ├─ Si autoImages + plan pago:
        │     └─ Edge Fn: generate-banner (Gemini)
        │           ├─ hero
        │           ├─ benefits
        │           └─ offer/cta   (en paralelo)
        │
        ├─ UPDATE profiles.landings_used++
        │
        └─ Redirige a /landings/:id
```

## Puntos críticos donde puede fallar
1. **Producto inválido/sin permisos** → redirige a /products (recién endurecido).
2. **Límite de plan alcanzado** → bloquea con toast y modal upgrade.
3. **Edge Function `generate-landing` cae** → OpenAI API down, JSON malformado, timeout. Toast de error genérico.
4. **INSERT en `landings`** → falla por RLS, columnas faltantes o tipos inválidos.
5. **Banners IA fallan** → cada uno tiene su propio try/catch, no rompe la landing (la landing igual se crea).
6. **UPDATE de `landings_used`** → no abortado, sin manejo de error.

Esto es lo que se ejecuta exactamente en cada generación de landing.
