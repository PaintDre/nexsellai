## Objetivo
Activar manualmente al usuario `juanideituzaingo@hotmail.com` como **Starter** sin requerir verificación de email, y dejarle los créditos del plan Starter (200).

## Pasos

1. **Confirmar email manualmente** (vía SQL en `auth.users`):
   - `UPDATE auth.users SET email_confirmed_at = now(), confirmed_at = now() WHERE email = 'juanideituzaingo@hotmail.com'`

2. **Asignar plan Starter en `profiles`**:
   - `plan = 'starter'`
   - `plan_expires_at = now() + interval '30 days'`
   - `credits_balance = 200` (allowance Starter según nueva Opción A)
   - `credits_reset_at = now()`
   - `credits_plan_snapshot = 'starter'`

3. **Crear suscripción activa** en `subscriptions`:
   - `plan_id = 'starter'`, `status = 'active'`, `started_at = now()`, `expires_at = now() + 30 días`
   - Esto evita que el cron de expiración o `getUserPlan()` lo degrade antes de tiempo.

4. **Registrar transacción de crédito** en `credit_transactions` (acción `manual_grant`) para auditoría.

## Notas
- Los pasos 1-4 se ejecutan con la herramienta de inserción SQL (no requiere migración, son cambios de datos).
- "Una vez terminado sus tokens déjalo en el usuario starter" → ya queda como Starter; cuando gaste los 200 créditos, el plan sigue siendo Starter (no se degrada). Solo se degradará a Free cuando expire `plan_expires_at` (30 días). Si querés que se quede Starter **indefinidamente** sin expiración, decímelo y dejo `plan_expires_at = NULL` + suscripción sin `expires_at`.

## Pregunta antes de ejecutar
¿Querés que el plan Starter le dure **30 días** (renovación normal) o **sin expiración** (acceso permanente como cortesía)?
