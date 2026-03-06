

## Plan: Modal de verificación + Correo de verificación profesional

### Parte 1: Modal de verificación de email en Register.tsx

**Archivo: `src/pages/Register.tsx`**

Tras registro exitoso, en vez de un toast pequeño + redirect automático, mostrar un `Dialog` grande y prominente:

- Estado `showVerificationDialog` + `registeredEmail`
- Al registrarse exitosamente: activar el dialog en vez de navegar
- El dialog muestra:
  - Icono grande de email (lucide `Mail` o `MailCheck`)
  - Título: "¡Revisa tu correo electrónico!"
  - Subtítulo: "Hemos enviado un enlace de verificación a **{email}**"
  - Instrucciones claras: revisar spam, etc.
  - Botón grande "Entendido, ir a iniciar sesión" que navega a `/login`
- El dialog NO se puede cerrar clickeando fuera (forzar interacción con el botón)

### Parte 2: Correo de verificación profesional

El proyecto tiene dominio custom `nexsellai.com` pero NO tiene dominio de email configurado. Para poder enviar emails personalizados desde ese dominio, primero necesitamos configurar el dominio de email.

**Flujo:**
1. Configurar dominio de email via el setup dialog
2. Scaffold de templates con `scaffold_auth_email_templates`
3. Aplicar branding Nexsell:
   - Color primario: `hsl(152, 60%, 36%)` (verde)
   - Foreground: `hsl(220, 25%, 10%)`
   - Muted: `hsl(220, 10%, 46%)`
   - Border radius: `0.75rem`
   - Logo: `/logo-ns.png`
   - Idioma: español (todo el copy en español)
   - Tono: profesional pero cercano, orientado a e-commerce/dropshipping
4. Deploy del edge function `auth-email-hook`

**Para la Parte 2**, necesitamos que primero configures tu dominio de email. Una vez configurado, crearemos templates de email profesionales con tu branding.

### Resumen

| Cambio | Archivo |
|--------|---------|
| Modal verificación post-registro | `src/pages/Register.tsx` |
| Templates de email profesionales | Requiere configurar dominio de email primero |

