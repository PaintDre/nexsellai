

## Plan: Mejorar Email Marketing con Preview y Emails Automáticos

### Resumen
Tres mejoras principales:
1. **Preview de emails** -- ver cómo se verá el email antes de enviarlo
2. **Plantillas predefinidas** -- templates listos para usar (bienvenida, recordatorio, descuento)
3. **Emails automáticos** -- sistema de automatizaciones que se disparan por eventos (registro, inactividad, no conversión a pago)

---

### 1. Preview de emails en el panel de campañas

**Archivo: `src/pages/AdminEmailCampaigns.tsx`**
- Agregar un botón "Vista previa" (icono Eye) en cada campaña y en el dialog de creación
- Al hacer clic, abrir un Dialog con un iframe/div que renderiza el HTML del email envuelto en el layout de Nexsell (logo, footer, branding `#2E9B63`)
- El preview reemplaza `{{nombre}}` con "Juan Ejemplo" para simular la personalización
- Tabs: "Editar" / "Vista previa" dentro del dialog de creación

### 2. Plantillas predefinidas de email

**Nuevo archivo: `src/lib/emailTemplates.ts`**
- Plantillas HTML prediseñadas con branding Nexsell:
  - **Bienvenida**: "¡Tu cuenta está lista! Crea tu primera landing..."
  - **Recordatorio de uso**: "No has creado landings aún, empieza ahora"
  - **Oferta de descuento**: "20% OFF en tu primer plan Starter/Pro"
  - **Abandono**: "Vimos que no completaste tu suscripción, aquí tienes un descuento"
  - **Reactivación**: "Te extrañamos, vuelve y crea contenido gratis"

**En `AdminEmailCampaigns.tsx`**: Selector de plantilla en el dialog de creación. Al seleccionar una, se pre-rellena el asunto y el body_html. El admin puede editarlo antes de guardar.

### 3. Sistema de emails automáticos

**Nueva tabla: `email_automations`**
```sql
CREATE TABLE email_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_event text NOT NULL, -- 'signup', 'no_landing_3d', 'no_payment_7d', 'inactive_14d'
  delay_hours integer NOT NULL DEFAULT 24,
  subject text NOT NULL,
  body_html text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

Con RLS para admin/super_admin solamente.

**Nueva tabla: `email_automation_logs`**
```sql
CREATE TABLE email_automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES email_automations(id),
  user_id uuid NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent'
);
```

**Nuevo archivo: `src/pages/AdminEmailAutomations.tsx`**
- UI para crear/editar/activar/desactivar automatizaciones
- Lista de automatizaciones con toggle de activación, preview, y logs de envío
- Formulario con: nombre, evento trigger (dropdown), delay en horas, asunto, contenido HTML, preview

**Nueva ruta en `App.tsx`**: `/admin/automations` dentro de `AdminLayout`

**Nuevo link en `AppSidebar.tsx`**: "Automatizaciones" con icono `Zap` en la sección admin

**Nuevo edge function: `supabase/functions/process-automations/index.ts`**
- Cron job (cada hora) que:
  1. Lee automatizaciones habilitadas
  2. Para cada trigger, consulta usuarios elegibles (registrados hace X horas sin landing, sin pago, etc.)
  3. Verifica que no se haya enviado ya (via `email_automation_logs`)
  4. Envía email via `send-campaign-email` y registra en logs

**Actualizar `admin-api/index.ts`**: CRUD endpoints para `/automations`

### Estructura de archivos

```text
src/lib/emailTemplates.ts          (plantillas HTML)
src/pages/AdminEmailAutomations.tsx (UI automatizaciones)
src/pages/AdminEmailCampaigns.tsx   (+ preview + selector plantillas)
supabase/functions/process-automations/index.ts (cron worker)
supabase/functions/admin-api/index.ts (+ CRUD automations)
```

### Flujo de emails automáticos

```text
Usuario se registra
  └─ [24h después] → "Bienvenida: crea tu primera landing"
      └─ [72h sin crear landing] → "Recordatorio: tu cuenta está lista"
          └─ [7d sin pagar] → "Oferta: 20% descuento en Starter"
              └─ [14d inactivo] → "Te extrañamos, vuelve"
```

