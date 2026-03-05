

# Plan: Toggle Mensual/Anual + Integración Mercado Pago

## 1. Toggle Mensual/Anual en Pricing

**Archivo: `src/pages/Pricing.tsx`**

- Agregar estado `billingPeriod: "monthly" | "annual"` con toggle visual usando los componentes `Tabs` existentes
- Precios anuales con **2 meses gratis** (descuento ~17%):
  - Starter: $14.990/mes → $149.900/año (equivale a $12.492/mes)
  - Pro: $34.990/mes → $349.900/año (equivale a $29.158/mes)
- Mostrar badge "Ahorra 2 meses" en el toggle anual
- Actualizar el array `plans` para incluir `annualPrice`
- Aplicar el mismo toggle en la sección de pricing de `src/pages/Index.tsx`

## 2. Integración Mercado Pago

### 2.1 Secret requerido
- Se necesita el **Access Token de Mercado Pago** (se obtiene en [mercadopago.cl/developers](https://www.mercadopago.cl/developers) → Credenciales de producción)
- Usar la herramienta `add_secret` para solicitar `MERCADOPAGO_ACCESS_TOKEN`

### 2.2 Edge Function: `supabase/functions/create-checkout/index.ts`
- Recibe: `planId`, `billingPeriod`, `userId`
- Valida que el usuario esté autenticado
- Crea una **Preference de Mercado Pago** con la API REST:
  - `POST https://api.mercadopago.com/checkout/preferences`
  - Items con título del plan, precio según periodo
  - `back_urls` apuntando a `/pricing?status=success|failure`
  - `notification_url` apuntando al webhook
  - `external_reference` con `userId:planId:period`
- Retorna la URL de checkout (`init_point`)

### 2.3 Edge Function: `supabase/functions/mercadopago-webhook/index.ts`
- Recibe notificaciones IPN de Mercado Pago
- Verifica el pago consultando `GET https://api.mercadopago.com/v1/payments/{id}`
- Si `status === "approved"`: actualiza `profiles.plan` del usuario usando service role key
- Registra el pago (opcional: tabla `payments` para historial)

### 2.4 Config: `supabase/config.toml`
- Agregar las dos nuevas funciones con `verify_jwt = false`

### 2.5 Frontend: `src/pages/Pricing.tsx`
- El botón "Suscribirse" llama a `supabase.functions.invoke("create-checkout", { body: { planId, billingPeriod } })`
- Redirige al usuario a la URL de Mercado Pago
- Al volver, muestra toast de éxito/error según query params

## 3. Migración DB (opcional pero recomendada)
- Crear tabla `payments` para registrar historial de pagos:
  - `id`, `user_id`, `plan`, `amount`, `period`, `mp_payment_id`, `status`, `created_at`

## Archivos

| Archivo | Cambio |
|---------|--------|
| `src/pages/Pricing.tsx` | Toggle mensual/anual + botón con checkout MP |
| `src/pages/Index.tsx` | Toggle mensual/anual en sección pricing |
| `supabase/functions/create-checkout/index.ts` | Nuevo - crear preference MP |
| `supabase/functions/mercadopago-webhook/index.ts` | Nuevo - procesar pagos |
| `supabase/config.toml` | Agregar funciones |
| Migración SQL | Tabla `payments` + RLS |

## Orden de ejecución

1. Solicitar el Access Token de Mercado Pago al usuario (bloqueante)
2. Crear migración DB para tabla `payments`
3. Crear edge functions
4. Actualizar frontend con toggle y checkout

