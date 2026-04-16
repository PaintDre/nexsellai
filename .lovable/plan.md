

## Plan: Editar y Eliminar Productos en Admin DROPI

### Cambios en `src/pages/AdminDropiCatalog.tsx`

Agregar dos acciones nuevas a cada fila de la tabla de productos:

**1. Editar nombre del producto (inline)**
- Reutilizar el patrón ya existente de edición inline del campo "Video"
- Nuevo estado: `editingName` y `nameValue`
- Botón ✏️ junto al nombre que activa el modo edición
- Input + botones ✓ / ✗ para guardar o cancelar
- Guarda con `supabase.from("dropi_products").update({ name }).eq("id", id)`

**2. Eliminar producto**
- Botón 🗑️ rojo en la columna de acciones
- Abre `AlertDialog` (shadcn) con confirmación: "¿Eliminar producto X? Esta acción no se puede deshacer."
- Al confirmar: `supabase.from("dropi_products").delete().eq("id", id)`
- Toast de éxito y refresca lista

### UI de la fila actualizada

```
[img] [Nombre ✏️] [Categoría] [Video ✓/✗ ✏️] [🗑️]
```

Cuando se edita el nombre:
```
[img] [Input ✓ ✗] [Categoría] [Video] [🗑️ deshabilitado]
```

### i18n (es/en/pt)
- `dropi.deleteProduct`: "Eliminar producto"
- `dropi.confirmDelete`: "¿Eliminar este producto? Esta acción no se puede deshacer."
- `dropi.editName`: "Editar nombre"
- `dropi.productDeleted`: "Producto eliminado"

### Detalles técnicos
- RLS ya permite a admins hacer DELETE/UPDATE sobre `dropi_products` (política "Admins can manage dropi products" con command ALL)
- No requiere edge function ni migración
- Solo se modifica un archivo + 3 archivos de traducciones

