

# Plan: Layout Responsive Mobile-First para Nexsell

## Problema actual

- `AppSidebar` es un `aside` fijo de `w-64` sin responsividad
- `AppLayout` usa `flex` sin adaptarse a mobile
- No hay hamburger menu ni Sheet/Drawer para mobile
- Las grids de productos, banners, landings y dashboard no tienen breakpoints consistentes

## Cambios

### 1. Nuevo `AppLayout.tsx` con Sheet para mobile

Reemplazar el layout actual por uno que detecte mobile con `useIsMobile()`:

- **Mobile (<768px)**: Header sticky con logo + hamburger button que abre un `Sheet` (side="left") con el contenido del sidebar. Sin sidebar fijo.
- **Tablet (768-1024)**: Sidebar colapsado (solo iconos, ~w-16) que se expande al hover o clic.
- **Desktop (>1024)**: Sidebar fijo `w-64` como ahora.

El `<main>` siempre ocupa `w-full` con `overflow-x-hidden` y `max-w-full`.

### 2. Refactor `AppSidebar.tsx`

Extraer el contenido del sidebar a un componente interno `SidebarContent` reutilizable, que se renderiza:
- Dentro del `Sheet` en mobile
- Como sidebar colapsado en tablet (solo iconos, sin labels)
- Como sidebar completo en desktop

Props: `collapsed: boolean`, `onNavigate?: () => void` (para cerrar el Sheet al navegar en mobile).

### 3. Header mobile en `AppLayout.tsx`

Solo visible en `<md`:
- Logo "Nexsell" centrado
- Botón hamburguesa (Menu icon) a la izquierda
- Fondo con `bg-sidebar`, height fija `h-14`

### 4. Grids responsive consistentes en todas las páginas

Actualizar las clases de grid en:

| Archivo | Actual | Nuevo |
|---------|--------|-------|
| `Dashboard.tsx` (stats) | `md:grid-cols-2 lg:grid-cols-4` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| `Products.tsx` | `md:grid-cols-2 lg:grid-cols-3` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| `Banners.tsx` | (verificar grid actual) | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| `Landings.tsx` | (verificar) | Asegurar 1 col mobile |

Ajustar paddings: `p-4 md:p-6 lg:p-8` en vez de `p-6 lg:p-8`.

### 5. Overflow global

Agregar `overflow-x: hidden` al contenedor principal y al `<main>` para eliminar scroll horizontal.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/AppLayout.tsx` | Header mobile + Sheet + layout responsive |
| `src/components/AppSidebar.tsx` | Extraer SidebarContent, soporte collapsed + onNavigate |
| `src/pages/Dashboard.tsx` | Grid y padding responsive |
| `src/pages/Products.tsx` | Grid y padding responsive |
| `src/pages/Banners.tsx` | Grid y padding responsive |
| `src/pages/Landings.tsx` | Grid y padding responsive |

