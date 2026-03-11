

# Plan: Precios por País con Equivalente en USD

## Situación actual
- Los precios están hardcoded en CLP ($14.990 / $34.990) en 3 lugares: `Pricing.tsx`, `create-checkout/index.ts`, y `mercadopago-webhook/index.ts`.
- El perfil del usuario ya tiene `country_code` y `currency` desde el registro.
- Mercado Pago solo acepta la moneda local del país donde está configurada la cuenta (en tu caso CLP).

## Diseño

### Tabla de precios por país
Crear un archivo `src/lib/pricing.ts` con precios en moneda local para cada país soportado, más su equivalente en USD para referencia visual:

```text
País        | Moneda | Starter/mes | Pro/mes   | USD equiv (Starter) | USD equiv (Pro)
------------|--------|-------------|-----------|---------------------|----------------
Chile       | CLP    | 14.990      | 34.990    | ~15                 | ~35
Argentina   | ARS    | 14.990      | 34.990    | ~15                 | ~35
Colombia    | COP    | 59.900      | 139.900   | ~15                 | ~35
México      | MXN    | 249         | 599       | ~15                 | ~35
Perú        | PEN    | 54.90       | 129.90    | ~15                 | ~35
Brasil      | BRL    | 79.90       | 189.90    | ~15                 | ~35
USD (default)| USD   | 14.99       | 34.99     | 14.99               | 34.99
EUR         | EUR    | 13.99       | 32.99     | ~15                 | ~35
```

Nota: Mercado Pago solo procesa en la moneda del país de la cuenta (CLP). Para usuarios de otros países, se mostrará el precio local como referencia pero el cobro real será en CLP. Cuando integres cuentas MP en otros países, se usará la moneda local.

### Cambios en Pricing.tsx
- Leer `profile.country_code` para determinar la moneda del usuario.
- Mostrar el precio en su moneda local + un texto pequeño "(~USD $14.99)" como referencia.
- Selector de país visible para que el usuario pueda cambiar si la detección fue incorrecta.
- Enviar `countryCode` al checkout para que el backend sepa qué precio cobrar.

### Cambios en create-checkout
- Recibir `countryCode` del frontend.
- Buscar el precio correspondiente en la tabla de precios por país.
- Por ahora, como MP está configurado en Chile, siempre cobra en CLP. Para otros países, convertir al equivalente CLP antes de enviar a MP.

### Cambios en mercadopago-webhook
- Actualizar `PLAN_PRICES` para que sea un mapa por país, o validar contra el precio CLP que se envió a MP (ya que MP siempre cobra en CLP por ahora).

## Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `src/lib/pricing.ts` | **Nuevo** — tabla de precios por país/moneda con USD equiv |
| `src/pages/Pricing.tsx` | Usar precios por país del perfil, mostrar equivalente USD, selector de país |
| `supabase/functions/create-checkout/index.ts` | Recibir countryCode, resolver precio correcto |
| `supabase/functions/mercadopago-webhook/index.ts` | Ajustar validación de monto para precios por país |

## Consideración importante sobre Mercado Pago
Mercado Pago procesa pagos en la moneda del país de la cuenta (tu cuenta es chilena → CLP). Para cobrar en ARS, MXN, BRL, etc., necesitarías cuentas MP en cada país. Por ahora, el plan muestra los precios en moneda local como referencia, pero el cobro real se hace en CLP. El precio mostrado y el cobrado serán consistentes en CLP.

