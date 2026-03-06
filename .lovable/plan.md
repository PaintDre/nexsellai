

## Plan: Recuperación de contraseña

### 1. Agregar enlace en Login.tsx

Debajo del campo de contraseña, agregar un link "¿Olvidaste tu contraseña?" que navegue a `/forgot-password`.

### 2. Crear página ForgotPassword.tsx

- Campo de email
- Botón "Enviar enlace de recuperación"
- Llama `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Muestra mensaje de confirmación tras enviar
- Link para volver a login

### 3. Crear página ResetPassword.tsx

- Detecta evento `PASSWORD_RECOVERY` via `onAuthStateChange`
- Muestra formulario: nueva contraseña + confirmar contraseña
- Valida que coincidan
- Llama `supabase.auth.updateUser({ password })`
- Redirige a `/login` con toast de éxito

### 4. Agregar rutas en App.tsx

- `/forgot-password` → ForgotPassword (ruta pública)
- `/reset-password` → ResetPassword (ruta pública)
- Lazy imports para ambas

### Archivos

| Archivo | Acción |
|---------|--------|
| `src/pages/Login.tsx` | Agregar link "¿Olvidaste tu contraseña?" |
| `src/pages/ForgotPassword.tsx` | Crear |
| `src/pages/ResetPassword.tsx` | Crear |
| `src/App.tsx` | Agregar 2 rutas públicas |

No se requieren cambios en base de datos. El email de recovery ya tiene template profesional configurado.

