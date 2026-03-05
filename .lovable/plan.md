

# Iteración 1: Dashboard simplificado + Pricing + Login + Registro

## Cambios

### 1. Dashboard simplificado (`src/pages/Dashboard.tsx`)
- **Mantener** botón "Nuevo Producto" en el header y stats cards
- **Reemplazar** sección "Productos Recientes" por **"Landings Recientes"**: lista de landings con nombre, fecha y botón "Ver"
- Empty state si no hay landings

### 2. Pricing actualizado (`src/pages/Pricing.tsx`)
- Agregar a Starter: "Generador de banners", "Imágenes IA en landings"
- Agregar a Pro: "Generador de banners avanzado", "Imágenes IA en landings", "Edición completa de secciones"

### 3. Login con recordar email (`src/pages/Login.tsx`)
- Leer `localStorage` key `nexsell_remembered_email` al montar para pre-llenar email
- Agregar checkbox "Recordar mi email" (usando Checkbox component existente)
- Guardar/limpiar localStorage en login exitoso según estado del checkbox

### 4. Registro con teléfono (`src/pages/Register.tsx`)
- Agregar campo "Teléfono" (opcional) con placeholder "+56 9 1234 5678"
- Enviar en `options.data.phone`

### 5. Migración SQL
- `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;`
- Actualizar `handle_new_user()` para incluir phone desde `raw_user_meta_data`

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Dashboard.tsx` | Reemplazar productos recientes por landings recientes |
| `src/pages/Pricing.tsx` | Agregar features de banners/imágenes IA |
| `src/pages/Login.tsx` | Checkbox recordar email + localStorage |
| `src/pages/Register.tsx` | Campo teléfono opcional |
| Migración SQL | Columna phone + actualizar trigger |

