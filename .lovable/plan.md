

# Iteración 4: Duplicación de landings, historial de versiones y rendimiento

## 1. Duplicar landing

**En `src/pages/Landings.tsx`:**
- Agregar botón "Duplicar" (icono Copy) en cada card de landing
- Handler `handleDuplicate`: inserta una nueva fila en `landings` con los mismos `blocks`, `product_id`, `mode`, `intensity`, `theme`, `has_offer`, `guarantee`, pero con nombre `"{nombre} (copia)"` y nuevo `id`/`created_at`
- Recargar la lista tras duplicar

**En `src/pages/LandingView.tsx`:**
- Agregar botón "Duplicar" en la barra superior (junto a Exportar)
- Mismo handler, pero tras duplicar navegar a la nueva landing con `navigate(/landings/${newId})`

## 2. Historial de versiones

**Migración SQL — nueva tabla `landing_versions`:**
```sql
CREATE TABLE public.landing_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id uuid NOT NULL REFERENCES public.landings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  blocks jsonb NOT NULL DEFAULT '[]',
  theme text NOT NULL DEFAULT 'clean',
  version_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  label text
);
ALTER TABLE public.landing_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own versions" ON public.landing_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own versions" ON public.landing_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own versions" ON public.landing_versions FOR DELETE USING (auth.uid() = user_id);
```

**En `src/pages/LandingView.tsx`:**
- Al guardar ediciones (`handleSave`), antes de actualizar, insertar un snapshot en `landing_versions` con los bloques **anteriores** (pre-edit)
- Agregar botón "Historial" que abre un Dialog/Sheet con lista de versiones (fecha + label opcional)
- Cada versión tiene botón "Restaurar" que carga esos bloques como los bloques actuales de la landing (update en `landings` + nuevo snapshot de la versión que se está reemplazando)
- Máximo 20 versiones por landing (al insertar, si hay >20, eliminar la más antigua)

## 3. Mejoras de rendimiento

**`src/components/landing/LandingRenderer.tsx`:**
- Envolver el componente en `React.memo` para evitar re-renders innecesarios
- Memoizar `parseFaqItems`, `CTAButton`, `CTAWithTrust` con `useMemo`/`useCallback`
- Agregar `loading="lazy"` a todas las imágenes (ya está en algunas, verificar las faltantes)

**`src/pages/Landings.tsx`:**
- Memoizar `getProductImage` con `useMemo` para evitar recalcular URLs de storage en cada render

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Crear tabla `landing_versions` con RLS |
| `src/pages/Landings.tsx` | Botón duplicar + memoización |
| `src/pages/LandingView.tsx` | Duplicar + historial de versiones + auto-snapshot al guardar |
| `src/components/landing/LandingRenderer.tsx` | `React.memo` + memoización interna |

