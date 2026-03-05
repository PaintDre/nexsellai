

# Plan: Mejora del flujo de producto, audiencia y dashboard

## Cambios a implementar

### 1. Reemplazar AudienceSelector con selector por columnas

**Archivo:** `src/components/AudienceSelector.tsx` -- reescribir completamente

Reemplazar el sistema actual de busqueda/autocompletado por un selector visual con 3 columnas de checkboxes:

| Edad | Intereses | Tipo de cliente |
|------|-----------|-----------------|
| 18-24 | Fitness | Compradores impulsivos |
| 25-34 | Tecnologia | Compradores racionales |
| 35-44 | Hogar | Padres |
| 45+ | Belleza | Deportistas |
|  | Salud | |

- Cada opcion es un checkbox/toggle seleccionable
- Eliminar campo de busqueda, usage_count, y el input de audiencia personalizada
- La interfaz devuelve las selecciones como array de strings (no objetos de BD)
- Layout: grid de 3 columnas en desktop, stack en movil

### 2. Actualizar ProductForm para nuevo selector y redirect

**Archivo:** `src/pages/ProductForm.tsx`

- Cambiar `selectedAudiences` de `Audience[]` a `string[]` (array de nombres seleccionados)
- Construir `target_audience` string directamente de las selecciones
- Eliminar la logica de `product_audiences` junction table (simplificar a solo guardar en `target_audience`)
- Eliminar el increment de `usage_count`
- Al crear producto nuevo: redirigir a `/products/${productId}` en vez de `/dashboard`

### 3. Crear pagina ProductDetail

**Archivo nuevo:** `src/pages/ProductDetail.tsx`

Pagina hub del producto recien creado con:
- Info del producto (imagen, nombre, precio, categoria)
- 3 botones de accion prominentes:
  - "Generar Landing" -> `/products/:id/generate`
  - "Generar Banners" -> `/products/:id/banner`
  - "Editar Producto" -> `/products/:id/edit`
- Lista de landings y banners ya generados para ese producto

**Archivo:** `src/App.tsx` -- agregar ruta `/products/:id` -> `ProductDetail`

### 4. Simplificar Dashboard

**Archivo:** `src/pages/Dashboard.tsx`

Mantener:
- Stats cards (productos, landings usadas, versiones, plan)
- Lista de landings recientes con preview y boton "Ver"
- Actividad reciente

Eliminar:
- Boton "Nuevo Producto" del header del dashboard (queda en Productos)

La seccion de landings recientes solo muestra nombre, fecha, tema y boton "Ver" (ya esta asi, no cambiar).

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/AudienceSelector.tsx` | Reescribir con columnas de checkboxes |
| `src/pages/ProductForm.tsx` | Simplificar audiencias, redirect a ProductDetail |
| `src/pages/ProductDetail.tsx` | **Nuevo** - hub del producto |
| `src/App.tsx` | Agregar ruta `/products/:id` |
| `src/pages/Dashboard.tsx` | Quitar boton "Nuevo Producto" del header |

