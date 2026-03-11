

# Plan: Localización por País — Registro, Perfil y Generación

## Objetivo
Capturar país y zona horaria del usuario al registrarse, almacenarlos en el perfil, y usar esa información para que banners y landings se generen con moneda, idioma y contexto cultural adecuados al país del usuario.

## 1. Migración de BD — Agregar columnas a `profiles`

```sql
ALTER TABLE public.profiles
  ADD COLUMN country_code text DEFAULT null,
  ADD COLUMN timezone text DEFAULT null,
  ADD COLUMN currency text DEFAULT 'USD';
```

- `country_code`: código ISO 3166-1 alpha-2 (ej: "AR", "CL", "MX", "CO")
- `timezone`: zona horaria IANA (ej: "America/Buenos_Aires")
- `currency`: moneda predeterminada derivada del país (ej: "ARS", "CLP")

## 2. Registro — Detectar país automáticamente

En `Register.tsx`:
- Usar `Intl.DateTimeFormat().resolvedOptions().timeZone` del navegador para detectar timezone
- Mapear timezone → país → moneda con un diccionario estático (ej: "America/Argentina/Buenos_Aires" → AR → ARS)
- Agregar un `<Select>` de país visible para que el usuario confirme/corrija
- Enviar `country_code`, `timezone` y `currency` en `options.data` del `signUp`

En el trigger `handle_new_user()`:
- Actualizar para leer `country_code`, `timezone`, `currency` de `raw_user_meta_data` y guardarlos en profiles

## 3. Settings — Sección País y Moneda

En `SettingsPage.tsx`:
- Nueva card "Región" con:
  - Select de país (lista de países latinoamericanos + US/EU principales)
  - Moneda (auto-derivada del país, pero editable)
  - Zona horaria (auto-detectada, editable)
- Al guardar, actualizar `profiles` con los nuevos valores

## 4. Onboarding — Mostrar selector de país si no está configurado

En `Onboarding.tsx`:
- Si `profile.country_code` es null, mostrar un paso previo rápido para confirmar país

## 5. Generación de Banners — Usar moneda y país del perfil

En `GenerateBanner.tsx` → `buildBannerPayload`:
- Agregar `currency: profile?.currency || "USD"` y `country: profile?.country_code` al payload

En `supabase/functions/generate-banner/index.ts`:
- Leer `currency` del body (ya existe `CURRENCY_MAP`)
- Agregar contexto de país al prompt: idioma del texto, estilo cultural, formato de precios

## 6. Generación de Landings — Usar moneda y país del perfil

En `GenerateLanding.tsx`:
- Pasar `currency` y `country_code` al invocar `generate-landing`

En `supabase/functions/generate-landing/index.ts`:
- Usar `currency` para formatear precios
- Usar `country_code` para ajustar tono/idioma/referencias culturales en el prompt

## Diccionario País → Moneda (constante compartida)

```typescript
// src/lib/countries.ts
export const COUNTRIES = [
  { code: "AR", name: "Argentina", currency: "ARS", timezone: "America/Argentina/Buenos_Aires" },
  { code: "CL", name: "Chile", currency: "CLP", timezone: "America/Santiago" },
  { code: "MX", name: "México", currency: "MXN", timezone: "America/Mexico_City" },
  { code: "CO", name: "Colombia", currency: "COP", timezone: "America/Bogota" },
  { code: "PE", name: "Perú", currency: "PEN", timezone: "America/Lima" },
  { code: "BR", name: "Brasil", currency: "BRL", timezone: "America/Sao_Paulo" },
  { code: "US", name: "Estados Unidos", currency: "USD", timezone: "America/New_York" },
  { code: "ES", name: "España", currency: "EUR", timezone: "Europe/Madrid" },
  // ... más según necesidad
];
```

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/lib/countries.ts` | Nuevo — diccionario de países |
| `profiles` table | Migración — 3 columnas nuevas |
| `handle_new_user()` trigger | Migración — leer country/timezone/currency |
| `src/pages/Register.tsx` | Agregar select de país + auto-detección |
| `src/pages/SettingsPage.tsx` | Nueva card "Región" |
| `src/pages/Onboarding.tsx` | Paso de confirmación de país |
| `src/pages/GenerateBanner.tsx` | Pasar currency/country en payload |
| `src/pages/GenerateLanding.tsx` | Pasar currency/country en payload |
| `supabase/functions/generate-banner/index.ts` | Usar country en prompt |
| `supabase/functions/generate-landing/index.ts` | Usar currency/country en prompt |

