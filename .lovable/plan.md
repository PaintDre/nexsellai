

## Plan: Optimizar interacción táctil y formularios para móvil

### Análisis del estado actual

La mayoría de las páginas ya tienen buenas bases mobile-first. Los problemas pendientes son puntuales:

### Cambios por archivo

**1. `src/components/ui/button.tsx`** — Touch targets globales
- Cambiar altura mínima del size `default` de `h-10` a `h-11` (44px) 
- Cambiar altura del size `sm` de `h-9` a `h-10` (40px mínimo, más cerca de 44px)
- Agregar `min-h-[44px]` al size `icon` también

**2. `src/pages/AdminUsers.tsx`** — Header responsive
- Reorganizar header en móvil: `flex-col sm:flex-row` para que "Volver" + título + "Guardar" no se compriman
- Título: reducir a `text-2xl sm:text-3xl`
- El botón "Guardar cambios" ocupa `w-full sm:w-auto` en móvil
- SelectTriggers en cards móviles: agregar `min-h-[44px]`
- Email: agregar `break-all` para evitar desbordamiento en emails largos

**3. `src/pages/SettingsPage.tsx`** — Padding y formularios
- Cambiar `p-6 lg:p-8` a `p-4 md:p-6 lg:p-8`
- Sección cambiar contraseña: cambiar `flex gap-2` a `flex flex-col sm:flex-row gap-2` para que input y botón se apilen en móvil
- Botones "Guardar nombre" y "Guardar preferencias": agregar `w-full sm:w-auto min-h-[44px]`

**4. `src/pages/ProductForm.tsx`** — Formulario móvil
- Agregar `max-w-full` al contenedor (actualmente `max-w-2xl` sin `w-full`)
- Botón "Volver": `min-h-[44px]`
- Grid imágenes: `grid-cols-2` ya es correcto para móvil
- CardContent padding: `p-4 sm:p-6`

**5. `src/pages/GenerateLanding.tsx`** — Formulario configuración
- El toggle "Activar oferta" y "Incluir imágenes IA": agregar `gap-4` y asegurar que el Switch tenga `shrink-0`
- Botón "Volver": `min-h-[44px]`

**6. `src/pages/GenerateBanner.tsx`** — Wizard steps
- Los steps del wizard en la parte superior pueden desbordarse en 320px: agregar `overflow-x-auto` o reducir texto en móvil

**7. `src/pages/Login.tsx` y `src/pages/Register.tsx`** — Botones auth
- Agregar `min-h-[44px]` a los botones de submit

**8. `src/pages/Pricing.tsx`** — Cards de planes
- Los cards ya se apilan en columna pero verificar que los botones tengan `min-h-[44px]`

**9. `src/index.css`** — Prevenir texto desbordante globalmente
- Agregar regla CSS global: `word-wrap: break-word; overflow-wrap: break-word` al body

### Resumen de impacto

| Área | Mejora |
|------|--------|
| Botones | Altura mínima 44px global vía button variants |
| Formularios | Campos en columna única, full-width en móvil |
| Textos | `break-all` en emails, `overflow-wrap` global |
| Headers | Stacking vertical en móvil |
| Touch targets | Separación adecuada entre elementos interactivos |

Todos los cambios son CSS/Tailwind. No se modifica lógica ni datos.

