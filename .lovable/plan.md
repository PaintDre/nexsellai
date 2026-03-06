

## Plan: Mejora completa de UX de autenticación + Onboarding

Este es un cambio grande. Lo dividimos en partes manejables.

### 1. Login page — Mejorar copy y layout

**Archivo: `src/pages/Login.tsx`**

- Título principal: "Crea landings para dropshipping en minutos"
- Subtítulo: "Genera páginas de venta profesionales con IA para tus productos de dropshipping"
- Mantener: email, password, Google sign-in, link a registro
- Mantener remember me y la lógica existente

### 2. Register page — Simplificar campos + confirmar contraseña

**Archivo: `src/pages/Register.tsx`**

- Campos: Nombre, Email, Contraseña, Confirmar contraseña
- Eliminar campo de teléfono (simplificar)
- Agregar validación de que contraseñas coincidan
- Mantener Google sign-in y modal de verificación de email
- Tras registro exitoso + verificación: redirigir a `/onboarding` en vez de `/login`

### 3. Crear página de Onboarding (nueva)

**Archivo nuevo: `src/pages/Onboarding.tsx`**

Flujo de 3 pasos con stepper visual:

**Step 1 — Bienvenida:**
- Icono/logo grande de Nexsell
- Título: "¡Bienvenido a Nexsell!"
- Explicación breve: qué es la plataforma y qué pueden hacer
- Botón "Comenzar"

**Step 2 — Crear primer producto:**
- Formulario inline (no redirige a ProductForm):
  - Nombre del producto (required)
  - Precio (required)
  - Upload de imagen (1 imagen, reusa lógica de ProductForm)
  - Categoría (select con las 5 existentes)
  - Descripción (opcional)
- Botón "Crear producto y generar landing"
- Al guardar: crea el producto en DB, luego invoca la generación de landing

**Step 3 — Loading de generación:**
- Pantalla de carga animada con progress bar
- Mensajes rotativos: "Analizando tu producto...", "Creando textos de venta...", "Generando landing..."
- Al completar: redirige a `/dashboard`

### 4. Ruta y protección

**Archivo: `src/App.tsx`**
- Agregar ruta `/onboarding` dentro de `ProtectedLayout`
- Lazy import de Onboarding

### 5. Lógica post-login: detectar si necesita onboarding

**Archivo: `src/pages/Login.tsx` y `src/hooks/useAuth.tsx`**
- Tras login exitoso, si el usuario tiene 0 productos → redirigir a `/onboarding`
- Si ya tiene productos → redirigir a `/dashboard`
- Esto se puede hacer con un query rápido en Login.tsx tras login exitoso

### 6. Dashboard — ya cumple los requisitos

El dashboard actual ya muestra: Productos, Landings, botón crear nuevo, Plan actual. No requiere cambios significativos.

### 7. Free plan — ya limitado

El límite de 1 landing para plan free ya está implementado (`planLimits.free = 1`). No requiere cambios.

### Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/pages/Login.tsx` | Mejorar copy (título/subtítulo) + lógica redirect onboarding |
| `src/pages/Register.tsx` | Agregar confirmar contraseña, quitar teléfono, redirect a onboarding |
| `src/pages/Onboarding.tsx` | **Crear** — flujo de 3 pasos |
| `src/App.tsx` | Agregar ruta `/onboarding` |

No se requieren cambios en base de datos.

