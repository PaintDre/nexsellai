

## Plan: Corregir textos en inglés en el flujo de recuperación de contraseña

### Problema encontrado

Revisé todo el flujo de autenticación (Login, Register, ForgotPassword, ResetPassword) y los enlaces funcionan correctamente. El unico problema es que en **ForgotPassword.tsx** se usa la palabra "login" en inglés en dos lugares:

- Linea 58: `"Volver al login"` (estado de correo enviado)
- Linea 74: `"Volver al login"` (debajo del formulario)

### Cambios

**Archivo: `src/pages/ForgotPassword.tsx`**
- Linea 58: Cambiar `"Volver al login"` → `"Volver a iniciar sesión"`
- Linea 74: Cambiar `"Volver al login"` → `"Volver a iniciar sesión"`

Solo son 2 cambios de texto. El resto del flujo (Login, Register, ResetPassword) ya esta completamente en español y todos los enlaces navegan a las rutas correctas.

