

# Plan: Responsive Mobile-First para todos los componentes de Nexsell

## Resumen

Adaptar todas las paginas de Nexsell para que funcionen correctamente en mobile, tablet y desktop, cubriendo tarjetas, formularios, tablas, editores y prevencion de scroll horizontal.

## Cambios por archivo

### 1. `src/pages/Dashboard.tsx` — Landings recientes como cards en mobile

- La lista de landings recientes (lineas 147-170) usa `flex items-center justify-between` que se comprime en mobile
- Cambiar a layout vertical en mobile: en `<sm` el contenido se apila (nombre arriba, badge + boton abajo)
- Agregar `min-h-[44px]` a botones para touch targets

### 2. `src/pages/Products.tsx` — Grids y botones touch-friendly

- Los botones dentro de cada card (Editar, Landing, Banner) son pequenos en mobile
- Hacer botones `min-h-[44px]` en mobile
- Grid ya tiene `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — correcto

### 3. `src/pages/Banners.tsx` — Filtros y cards responsive

- Los filtros (lineas 300-336) usan `SelectTrigger` con anchos fijos (`w-[150px]`, `w-[130px]`) que se comprimen en mobile
- Cambiar a `w-full sm:w-[150px]` para que ocupen ancho completo en mobile
- La barra de filtros debe ser vertical en mobile (`flex-col` en `<sm`)
- Botones en BannerCard: hacer `min-h-[44px]`
- Preview modal: padding y botones responsive

### 4. `src/pages/Landings.tsx` — Cards con botones responsive

- Los botones del card (Editor, Preview, Duplicar, Exportar, Eliminar — lineas 222-254) son 5 botones en una fila que se comprimen
- Reorganizar: en mobile, 2 filas de botones (Editor+Preview arriba, acciones abajo)
- Badges: permitir wrap

### 5. `src/pages/ProductDetail.tsx` — Layout y lista responsive

- Padding: cambiar `p-6 lg:p-8` a `p-4 md:p-6 lg:p-8`
- La lista de landings (lineas 126-149) usa `flex items-center justify-between` — en mobile apilar verticalmente
- Action buttons grid ya es `grid-cols-1 sm:grid-cols-3` — correcto

### 6. `src/pages/ProductForm.tsx` — Formulario responsive

- Padding: cambiar `p-6 lg:p-8` a `p-4 md:p-6 lg:p-8`
- El formulario ya es single-column — correcto
- Agregar `min-h-[44px]` al boton submit

### 7. `src/pages/GenerateBanner.tsx` — Wizard responsive

- Padding: cambiar `p-6 lg:p-8` a `p-4 md:p-6 lg:p-8`
- Step 2 (descripcion): el layout `flex gap-4` con imagen + textarea debe ser `flex-col sm:flex-row`
- Step 3 (cantidad): `grid-cols-3` de opciones debe ser `grid-cols-1 sm:grid-cols-3`
- Step 4 summary: `grid-cols-2 sm:grid-cols-4` ya es correcto
- Navigation buttons: `min-h-[44px]`

### 8. `src/pages/GenerateLanding.tsx` — Formulario responsive

- Padding: cambiar `p-6 lg:p-8` a `p-4 md:p-6 lg:p-8`
- Botones: `min-h-[44px]`

### 9. `src/pages/AdminUsers.tsx` — Tabla a cards en mobile

- La tabla HTML (lineas 196-258) se desborda en mobile
- Crear vista alternativa: en `<md` mostrar cada usuario como una Card vertical con los campos apilados
- En `>=md` mantener la tabla actual
- Usar `useIsMobile()` para alternar entre vistas

### 10. Overflow global

- Verificar que `AppLayout.tsx` tiene `overflow-x-hidden` en el main — ya lo tiene

## Archivos a modificar

| Archivo | Cambio principal |
|---------|-----------------|
| `src/pages/Dashboard.tsx` | Landings recientes responsive |
| `src/pages/Products.tsx` | Botones touch-friendly |
| `src/pages/Banners.tsx` | Filtros full-width mobile, botones 44px |
| `src/pages/Landings.tsx` | Botones en 2 filas en mobile |
| `src/pages/ProductDetail.tsx` | Padding + lista responsive |
| `src/pages/ProductForm.tsx` | Padding + boton 44px |
| `src/pages/GenerateBanner.tsx` | Wizard steps responsive |
| `src/pages/GenerateLanding.tsx` | Padding + botones 44px |
| `src/pages/AdminUsers.tsx` | Tabla a cards en mobile |

