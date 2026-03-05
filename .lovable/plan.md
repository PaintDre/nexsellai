

# Iteracion 7: Publicacion publica, analytics de visitas y compartir en redes

## 1. Migracion SQL

Agregar columnas a `landings`:
- `published` boolean default false
- `slug` text unique (URL-friendly identifier)
- `published_at` timestamptz

Nueva tabla `landing_views` para analytics:
```sql
CREATE TABLE public.landing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id uuid NOT NULL REFERENCES public.landings(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  referrer text,
  user_agent text
);
ALTER TABLE public.landing_views ENABLE ROW LEVEL SECURITY;
-- Cualquiera puede insertar (visitantes anonimos)
CREATE POLICY "Anyone can insert views" ON public.landing_views FOR INSERT WITH CHECK (true);
-- Solo el dueno puede leer sus analytics
CREATE POLICY "Owners can read views" ON public.landing_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM landings WHERE landings.id = landing_views.landing_id AND landings.user_id = auth.uid()));
```

RLS para landings: agregar policy SELECT publica para landings publicadas:
```sql
CREATE POLICY "Public can view published landings" ON public.landings FOR SELECT USING (published = true);
```

## 2. Pagina publica: `src/pages/PublicLanding.tsx`

- Ruta `/p/:slug` (fuera de ProtectedLayout, sin autenticacion)
- Carga landing por slug donde `published = true`
- Renderiza `LandingRenderer` con el tema guardado
- Al cargar, inserta un registro en `landing_views` (referrer + user_agent)
- Meta tags para Open Graph (og:title, og:description) via `document.title` y meta tags dinamicos
- Sin barra de edicion, solo contenido limpio

## 3. Controles de publicacion en `LandingView.tsx`

- Boton "Publicar" / "Despublicar" en la barra superior
- Al publicar por primera vez, generar slug automatico basado en el nombre (slugify)
- Dialog para confirmar publicacion con preview del URL publico
- Boton copiar URL publica al clipboard
- Boton compartir con dropdown: Facebook, Twitter/X, LinkedIn, WhatsApp (usando URLs de share nativas)

## 4. Analytics basico en `LandingView.tsx`

- Card o seccion debajo del preview mostrando:
  - Total de visitas
  - Visitas ultimos 7 dias
  - Grafico simple con recharts (ya instalado) de visitas por dia

## 5. Ruta en `App.tsx`

- Agregar `/p/:slug` como ruta publica (fuera de ProtectedLayout)

## Archivos a crear/modificar

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Columnas en landings + tabla landing_views + RLS |
| `src/pages/PublicLanding.tsx` | Nueva pagina publica |
| `src/pages/LandingView.tsx` | Botones publicar/compartir + analytics |
| `src/App.tsx` | Ruta `/p/:slug` |

