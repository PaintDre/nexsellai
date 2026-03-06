

## Plan: Simplificar vista de AdminUsers — solo lo esencial

### Cambios en `src/pages/AdminUsers.tsx`

**Eliminar la columna/sección "Landings"** en ambos layouts:

1. **Mobile (cards)**: Eliminar el bloque de líneas 240-242 que muestra "Landings: X"
2. **Desktop (tabla)**: Eliminar el `<th>` "Landings" (línea 260) y el `<td>` correspondiente (línea 295)

La vista quedará mostrando solo: Nombre, Email, Plan, Rol y Acciones — lo esencial para gestionar usuarios.

