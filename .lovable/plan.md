

## Plan: Mejora del layout mobile-first para Nexsell

### Estado actual

Tras revisar el código, el sistema ya tiene buenas bases responsive:

- **AppLayout.tsx**: Ya implementa menú hamburguesa con Sheet para móvil, sidebar colapsada para tablet, y sidebar completa para desktop
- **Dashboard, Products, Landings, Banners, AdminUsers**: Ya usan `p-4 md:p-6 lg:p-8` y grids responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- **AdminUsers**: Ya tiene layout de cards para móvil vs tabla para desktop
- **Botones**: Ya tienen `min-h-[44px]` para touch targets en móvil

### Problemas identificados

1. **AdminDashboard**: Usa `p-6 md:p-10` (sin `p-4` para móvil), el header tiene botones en fila que se desbordan en pantallas pequeñas, y la tabla de top users no se adapta
2. **Dashboard header**: El botón "Nuevo Producto" puede comprimirse en pantallas < 375px
3. **Banners filters bar**: Los filtros en la barra se apilan con `flex-wrap` pero pueden verse apretados en 320px
4. **AdminDashboard stats grid**: Usa `md:grid-cols-2 lg:grid-cols-4` sin `grid-cols-1` explícito base (funciona pero la distribución de planes se desborda en 320px)
5. **Global overflow**: No hay `overflow-x: hidden` en el contenedor principal para prevenir scroll horizontal accidental

### Cambios propuestos

**1. `src/components/AppLayout.tsx`**
- Agregar `overflow-x-hidden` al contenedor `<main>` (ya lo tiene) y al wrapper `<div>` raíz para prevenir scroll horizontal global

**2. `src/pages/AdminDashboard.tsx`**
- Cambiar `p-6 md:p-10` a `p-4 md:p-6 lg:p-10`
- Reorganizar header: en móvil, titulo + botones en columna (`flex-col sm:flex-row`)
- Hacer la tabla de "top users" responsive: en móvil, convertir a cards como en AdminUsers
- Hacer que las stats de "Distribución por Plan" se muestren en columna en móvil

**3. `src/pages/Dashboard.tsx`**
- Reorganizar header en móvil: título y botón en columna (`flex-col sm:flex-row`)
- El botón "Nuevo Producto" ocupa ancho completo en móvil (`w-full sm:w-auto`)

**4. `src/pages/Banners.tsx`**
- Los SelectTriggers de filtros ya tienen `w-full sm:w-[150px]` — correcto
- Asegurar que el preview modal use `max-w-[95vw]` en móvil para que no se desborde

**5. `src/pages/Products.tsx`**
- Header: reorganizar a columna en móvil como Dashboard

**6. `src/pages/Landings.tsx`**
- Los botones de acción dentro de cada card (Duplicar, Exportar, Eliminar) se muestran en fila de 3. En pantallas < 375px, reorganizar para que se ajusten mejor

**7. `src/pages/SettingsPage.tsx`**
- Verificar padding (ya usa card layout que se adapta)

### Resumen de archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `AppLayout.tsx` | `overflow-x-hidden` en wrapper raíz |
| `AdminDashboard.tsx` | Padding, header responsive, tabla top users como cards en móvil |
| `Dashboard.tsx` | Header en columna en móvil |
| `Products.tsx` | Header en columna en móvil |
| `Banners.tsx` | Preview modal max-width móvil |
| `Landings.tsx` | Botones de acción flex-wrap en cards |

Todos los cambios son puramente CSS/layout usando clases Tailwind existentes. No se modifica lógica ni estructura de datos.

