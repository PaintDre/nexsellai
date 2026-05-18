# Roadmap: Nexsell → Landing Pro + Shopify Nativo

Norte estratégico: que el cliente genere una landing en Nexsell, la edite a su gusto, y con un solo clic aparezca publicada en su Shopify **idéntica a lo que vio en Nexsell**, con Add to Cart, variantes, bundles y upsells funcionando contra su catálogo real.

Esta fase 1 cubre landings. Banners y resto del ecosistema vienen en fases posteriores (ya las dejo mapeadas al final).

---

## Diagnóstico actual (qué tenemos hoy)

```text
[Producto] → generate-landing (Strategy → Blocks → Critic)
            → blocks[] guardados en tabla landings
            → LandingRenderer (React)
            → /p/:slug público en Nexsell
            → Export Shopify:
                · exportShopify.ts (ZIP Liquid/JSON)
                · shopify-export edge fn (OAuth + API push)
                  scopes: write_content, write_themes, read_products
```

Fortalezas: AIDA 7 bloques, 3 pasos IA con crítico, 4 temas, editor inline, OAuth Shopify ya conectado.

Brechas que limitan ser "profesional":

1. **El push a Shopify NO replica visualmente la landing 1:1** — se exporta como page HTML/Liquid sin secciones editables ni Add to Cart real.
2. **Sin bridge de productos**: la landing usa el producto interno de Nexsell, no el `product_id` real de Shopify → no hay carrito ni variantes.
3. **Editor visual limitado**: solo edición inline de texto, no reordenar bloques, no cambiar imágenes desde el canvas, no preview multi-device sincronizado.
4. **Pipeline IA estancado**: 3 pasos rígidos, sin variantes A/B, sin bloques especializados por categoría (skincare ≠ electrónica ≠ moda).
5. **Sin métricas de conversión** post-publicación que retroalimenten la IA.

---

## Fase 1 — Landing Pro (4 sprints, ~6 semanas)

### Sprint 1 · Núcleo de generación IA v2

Objetivo: subir calidad de copy y estructura sin tocar UI todavía.

- **Pipeline IA expandido a 5 pasos**:
  ```text
  1. Market Research  → análisis de categoría + ángulos ganadores (web search opcional)
  2. Strategy         → AIDA + hooks + objeciones + bundle logic
  3. Blocks v2        → 12 bloques disponibles (vs 7 actuales)
  4. Critic           → revisa coherencia + score por bloque
  5. Polish           → reescribe bloques con score < 7
  ```
- **Nuevos bloques**: `social_proof_carousel`, `comparison_table`, `urgency_bar`, `sticky_cta`, `video_testimonial`, `before_after`, `bundle_offer`.
- **Prompt packs por categoría** en `system_config` (skincare, suplementos, moda, hogar, electrónica, mascotas) con tono, objeciones y formatos específicos.
- **Modelo**: `google/gemini-3-flash-preview` para velocidad + `openai/gpt-5.2` para el paso Critic/Polish.
- **Variantes**: cada generación produce 2 variantes (A/B) del bloque hero y CTA principal.

### Sprint 2 · Editor visual completo

Objetivo: que el usuario pueda llevar la landing al estado exacto que quiere antes de publicar.

- **Canvas drag-and-drop** de bloques (reordenar, ocultar, duplicar) usando `dnd-kit`.
- **Panel lateral** por bloque: editar texto inline + cambiar imagen (subir / elegir banner generado / asset library) + ajustar color de acento del bloque + toggle de visibilidad.
- **Preview sincronizado** desktop/tablet/mobile en tiempo real (iframe ya existe, agregar split-view).
- **Re-generar bloque individual** con IA ("rehazme solo el hero", "dame otro CTA más urgente").
- **Versionado mejorado**: ya hay 20 auto-versiones, agregar diff visual y "restaurar bloque" granular.

### Sprint 3 · Bridge Nexsell ↔ Shopify (la pieza clave)

Objetivo: que cada producto/landing de Nexsell quede **mapeado a un producto real de Shopify** para habilitar carrito.

- **Sync de catálogo Shopify**: tras OAuth, importar productos (id, handle, variantes, precios, imágenes) y guardarlos en nueva tabla `shopify_products` linkeada al `user_id`.
- **Wizard "Conectar producto"**: al crear landing, opcionalmente vincular el `product.id` de Nexsell con un `shopify_product_id` (o crear uno nuevo en Shopify desde Nexsell vía API).
- **Render Liquid con datos reales**: en el export, los bloques de precio/variantes/CTA leen `{{ product.price }}`, `{{ product.variants }}`, etc. en vez de hardcodear.
- **Add to Cart, Buy Now, Bundles los tres habilitados**:
  - Add to Cart con selector de variantes (AJAX cart drawer del theme).
  - Buy Now → `/cart/{{ variant.id }}:1?checkout`.
  - Bundle: `cart/add.js` múltiples variantes en una llamada (2x1, combos).
- **Scope extra requerido**: agregar `write_products`, `write_draft_orders` al OAuth (ya tenemos `read_products`).

### Sprint 4 · Push 1:1 a Shopify (que se vea idéntico)

Objetivo: clic en "Publicar a Shopify" → landing aparece en la tienda viéndose exactamente igual.

- **Estrategia híbrida (recomendada)**:
  1. Generar una **section Liquid `nexsell-landing.liquid**` que se instala una vez en el tema del cliente (vía Theme API). Esta section es un "runtime" que renderiza cualquier landing de Nexsell.
  2. Para cada landing, crear/actualizar una **page** en Shopify con un template `page.nexsell-{slug}.json` que referencia esa section y le pasa los `blocks[]` como settings JSON.
  3. Los assets (imágenes, banners) se suben a Shopify Files vía Asset API → URLs absolutas en el theme del cliente (no más dependencia de Supabase storage para el render final).
- **Ventajas**:
  - 1:1 visual garantizado (misma section, mismo CSS, mismos datos).
  - Editable desde el theme editor de Shopify (cada bloque expone settings).
  - Re-publish actualiza solo el `page.json`, no rompe el theme.
- **Fallback ZIP**: se mantiene el export ZIP actual para tiendas no conectadas o usuarios que prefieren instalar a mano.
- **Estado de publicación** en UI: "Publicado en Shopify · ver en tienda · re-publicar · despublicar".

---

## Detalles técnicos

### Schema nuevo (migraciones)

```sql
-- Productos importados de Shopify
create table shopify_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  shopify_product_id text not null,
  handle text not null,
  title text not null,
  variants jsonb not null default '[]',
  images jsonb not null default '[]',
  synced_at timestamptz not null default now(),
  unique(user_id, shopify_product_id)
);

-- Mapeo landing ↔ producto Shopify + estado publicación
alter table landings
  add column shopify_product_id text,
  add column shopify_page_id text,
  add column shopify_published_at timestamptz,
  add column shopify_status text default 'not_published';

-- Variantes A/B
alter table landings
  add column variants jsonb default '[]'; -- [{block_id, variant_a, variant_b, winning}]
```

### Edge functions nuevas / actualizadas

- `shopify-sync-products` (nueva): pull catálogo del cliente vía Admin API.
- `shopify-publish-landing` (nueva): instala section si falta, sube assets, crea/actualiza page + template.
- `generate-landing` (actualizar): pipeline de 5 pasos, prompt packs por categoría, variantes A/B.
- `regenerate-block` (nueva): regenerar bloque individual con contexto del resto.

### Modelos IA por paso (Lovable AI Gateway)


| Paso            | Modelo                          | Razón                           |
| --------------- | ------------------------------- | ------------------------------- |
| Market research | `google/gemini-3-flash-preview` | rápido + buen contexto largo    |
| Strategy        | `openai/gpt-5.2`                | mejor razonamiento estructurado |
| Blocks          | `google/gemini-3-flash-preview` | volumen + velocidad             |
| Critic          | `openai/gpt-5.2`                | precisión en scoring            |
| Polish          | `openai/gpt-5-mini`             | balance costo/calidad           |


### Métricas de éxito (instrumentar desde Sprint 1)

- % de landings que llegan a "Publicado en Shopify" sobre las generadas.
- Tiempo medio de generación + edición hasta publicar.
- CR de la landing en Shopify (`landing_views` + eventos `add_to_cart` desde Shopify webhook `carts/create`).
- NPS in-app post-publicación ("¿quedó como querías?" 1-10).
- Tasa de re-generación de bloques (señal de calidad IA).

---

## Fases posteriores (mapeadas, no se ejecutan ahora)

- **Fase 2 · Banners Pro**: nuevos templates AIDA verticales/cuadrados/historias, motor de composición con capas editables post-IA, A/B de creativos, integración directa con Meta Ads (subir creativos vía API).
- **Fase 3 · Ecosistema unificado**: campaña = landing + 3 banners + email + ads, todo coherente desde un solo brief.
- **Fase 4 · Analytics & optimización**: dashboard de CR por landing/bloque, sugerencias IA basadas en datos reales, auto-ganador A/B.
- **Fase 5 · Marketplace**: templates pre-armados por nicho, instalables en 1 clic.

---

## Qué necesito de ti para arrancar Sprint 1

1. Confirmar que vamos con la **estrategia híbrida section+page** para Shopify (es la única que garantiza 1:1 visual y mantiene editable).  
Necesito que antes de ejecutar me expliques si esta seccion va a funcionar donde los clientes podran cambiar sus productos por otro que tengan ademas de mostar la landing en su web con su Link y todo dentro de su shopify no dentro de nexsell
2. ¿Activamos también la creación de productos en Shopify desde Nexsell (requiere scope `write_products`), o solo vinculamos productos ya existentes en la tienda del cliente?  
podemos agregar los productos que tenga el cliente 
3. ¿Mantenemos los 4 temas actuales (Minimal/Bold/Clean/Warm) o agregamos 2 más orientados a nichos (Beauty/Tech) en Sprint 2 agregalos

Cuando me confirmes, arranco implementando Sprint 1 (pipeline IA v2 + prompt packs por categoría).  
  
necesito saber si es mejor que hagamos que el cliente cuando quiera le servicio entre y se registre luego de eso obtener su coneccion de shopify para asi el administrar sus productos y otros para hacer sus banners y landing con los que tiene.

  
  
aparte de esto no ejecutes dime lo que te pdi y luego te mando el promp para ejecutar este roadmap 