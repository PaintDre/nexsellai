

# Plan: Seguridad de Pagos + Emails Transaccionales de Pagos + Email Marketing Basico

## Problemas de seguridad encontrados

### 1. Sin validación de idempotencia en el webhook
El webhook `mercadopago-webhook` no verifica si un pago ya fue procesado. Si Mercado Pago reenvía la notificación (retry), el plan se actualiza múltiples veces y se puede insertar duplicados.

**Fix**: Verificar si `mp_payment_id` ya existe con status `approved` antes de procesar.

### 2. Sin expiración de plan
No existe ningún campo `plan_expires_at` ni `subscription_ends_at` en `profiles`. Un usuario paga una vez y tiene el plan para siempre. No hay lógica de renovación ni downgrade automático.

**Fix**: Agregar columna `plan_expires_at` a `profiles`. El webhook calcula la fecha de expiración (30 días para mensual, 365 para anual). Agregar un cron job o verificación en el frontend que haga downgrade a `free` cuando expire.

### 3. Sin validación de monto en el webhook
El webhook acepta cualquier `transaction_amount` de MP sin verificar que corresponda al precio real del plan. Un atacante podría crear una preferencia con precio $1 y obtener un plan Pro.

**Fix**: Validar en el webhook que `payment.transaction_amount` coincida con los precios definidos para el `planId` y `period` del `external_reference`.

### 4. Sin protección contra manipulación de `external_reference`
Si alguien genera una preferencia MP con un `external_reference` apuntando al `userId` de otro usuario, puede cambiar el plan de otra persona.

**Fix**: Verificar en el webhook que la preferencia original (`mp_preference_id`) coincida con el `user_id` almacenado en la tabla `payments`.

### 5. Webhook sin validación de firma
MP envía un header `x-signature` que permite verificar autenticidad. Actualmente no se valida.

**Fix**: Implementar validación HMAC del webhook usando el secret de MP.

### 6. `getClaims` no existe en supabase-js v2
En `create-checkout`, se usa `supabase.auth.getClaims(token)` que no es un método válido. Debería ser `supabase.auth.getUser(token)`.

**Fix**: Reemplazar por `getUser`.

---

## Emails transaccionales de pagos

Crear un Edge Function `send-transactional-email` que envíe emails usando el sistema Lovable Cloud:

1. **Email de confirmación de pago**: Se dispara desde el webhook cuando un pago es `approved`. Contiene: nombre del plan, monto, período, fecha, ID de transacción.
2. **Email de bienvenida al plan**: Junto con la confirmación, incluye las features desbloqueadas del nuevo plan.
3. **Email de plan por vencer** (futuro): Cuando `plan_expires_at` está a 7 días de expirar.

---

## Email marketing basico

Crear una tabla `email_campaigns` y una UI admin para:
- Crear campañas simples (asunto, cuerpo HTML, audiencia: todos/free/starter/pro)
- Enviar a todos los usuarios de un segmento
- Registrar envíos en `email_sends`

---

## Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| `supabase/functions/mercadopago-webhook/index.ts` | Idempotencia, validación de monto, verificar mp_preference_id → user_id, firma HMAC |
| `supabase/functions/create-checkout/index.ts` | Fix `getClaims` → `getUser` |
| Migración SQL | Agregar `plan_expires_at` a profiles |
| `src/hooks/useAuth.tsx` | Verificar expiración de plan en frontend |
| `supabase/functions/send-payment-email/index.ts` | Nuevo: email de confirmación de pago |
| `supabase/functions/admin-api/index.ts` | Endpoints para campañas de email |
| Migración SQL | Tabla `email_campaigns` y `email_sends` |
| `src/pages/AdminEmailCampaigns.tsx` | Nuevo: UI admin para crear/enviar campañas |
| `src/App.tsx` | Nueva ruta admin |
| `src/components/AppSidebar.tsx` | Link a campañas |

## Orden de implementación

1. Fix bugs de seguridad (webhook + create-checkout)
2. Agregar `plan_expires_at` y lógica de expiración
3. Email transaccional de confirmación de pago
4. Email marketing basico (tabla + UI + envío)

