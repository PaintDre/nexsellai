

# Plan: Mejora Premium de Autenticación

## Cambios por archivo

### 1. Login.tsx — Rediseño completo
- Layout split en desktop: panel izquierdo con branding/valor (fondo oscuro con gradiente) + panel derecho con formulario
- Mobile: solo formulario con header de branding compacto
- Inputs con iconos (Mail, Lock) dentro del input
- Password toggle (ojo para mostrar/ocultar)
- Loading state con spinner animado en el botón
- Mejor espaciado entre secciones (gap-5 en vez de gap-4)
- Footer con copyright sutil

### 2. Register.tsx — Mismo layout split
- Panel izquierdo con bullet points de valor ("Landings con IA", "Banners profesionales", "Exporta y publica")
- Password strength indicator visual (barra de progreso con colores rojo/amarillo/verde)
- Validación en tiempo real: contraseñas coinciden (check/x icon), longitud mínima
- Mantener el Dialog de verificación de email existente

### 3. ForgotPassword.tsx — Diseño consistente
- Mismo layout centrado pero con el nuevo estilo de inputs
- Icono de candado/mail en el header
- Estado de éxito más visual con animación de check

### 4. ResetPassword.tsx — Diseño consistente
- Password strength indicator
- Validación en tiempo real de match
- Estado de loading mejorado en la pantalla de verificación

### 5. Nuevo componente: `src/components/auth/AuthLayout.tsx`
- Componente reutilizable con el layout split (panel branding + panel form)
- Recibe props: title, subtitle, children, showBranding
- Panel izquierdo: logo grande, tagline, 3 feature bullets con iconos (Sparkles, Zap, Shield)
- Background con gradiente sutil verde oscuro
- Solo visible en `md:` breakpoint y superior

### 6. Nuevo componente: `src/components/auth/PasswordStrengthBar.tsx`
- Recibe password string
- Calcula score: length >= 6 (weak), + uppercase (medium), + number + special char (strong)
- Barra visual con 3 segmentos que se llenan con color
- Label: "Débil" / "Media" / "Fuerte"

### 7. Nuevo componente: `src/components/auth/PasswordInput.tsx`
- Input de password con toggle show/hide (Eye/EyeOff icons)
- Reutilizable en Login, Register, ResetPassword

## Detalles de diseño

- Panel branding: `bg-gradient-to-br from-[hsl(152,60%,20%)] to-[hsl(220,25%,10%)]` con texto blanco
- Inputs: `h-12` (más grandes que h-10 default), con iconos a la izquierda usando relative positioning
- Botón CTA: `h-12 text-base font-semibold` con transición
- Transiciones: `transition-all duration-200` en inputs para focus states
- Mobile: panel branding se oculta, formulario ocupa todo el ancho

## Lo que NO cambia
- Lógica de autenticación (signInWithPassword, signUp, resetPasswordForEmail, updateUser)
- Google OAuth flow
- Remember me functionality
- Email verification dialog behavior
- Redirect logic post-login (products check → onboarding/dashboard)

