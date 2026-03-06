

# Plan: Dashboard Premium + Mejora de Flujos de Usuario

## Alcance

Este plan cubre dos áreas: (1) rediseño del dashboard y navegación, y (2) mejora de flujos clave para reducir fricción.

---

## Parte 1: Dashboard y Navegación

### 1.1 Dashboard.tsx — Rediseño completo

**Header mejorado:**
- Saludo contextual con hora del día ("Buenos días", "Buenas tardes")
- Subtítulo con resumen rápido ("Tienes X productos y X landings")

**Quick Actions (nuevo):**
- Sección de 3 cards de acción rápida debajo del header: "Nuevo Producto", "Mis Landings", "Mis Banners" con iconos y descripciones cortas
- Reemplaza el botón suelto "Nuevo Producto" actual

**Stats cards reorganizadas:**
- 2 cards principales grandes (Landings Usadas, Banners Usados) con progress bars
- 2 cards secundarias más pequeñas (Productos, Plan Actual) en una fila inferior
- Jerarquía visual clara: las métricas de uso son prominentes

**Guía contextual (empty/new user state):**
- Si 0 productos: card de onboarding prominente con stepper visual "1. Crea un producto → 2. Genera una landing → 3. Exporta y vende"
- Si tiene productos pero 0 landings: CTA contextual "Genera tu primera landing"

**Landings Recientes mejoradas:**
- Agregar botones "Editar" y "Exportar" además de "Ver"
- Mostrar badge de estado (publicada/borrador)
- Header de sección con link "Ver todas →"

**Actividad Reciente:**
- Mover a una card lateral en desktop (layout 2 columnas: landings + actividad)
- Mejorar labels: "Versión guardada de {nombre}" en vez de solo número

### 1.2 AppLayout.tsx — Header persistente en desktop

- Agregar un header slim (h-14) en desktop/tablet con:
  - Breadcrumb dinámico basado en la ruta actual
  - Nombre de usuario + badge de plan a la derecha
- Usar un nuevo componente `PageBreadcrumb.tsx`

### 1.3 AppSidebar.tsx — Mejoras menores

- Agregar separador visual entre items principales y admin
- Tooltip en modo collapsed mejorado

### 1.4 Nuevo: `src/components/PageBreadcrumb.tsx`

- Componente que lee `useLocation()` y genera breadcrumbs automáticos
- Mapa de rutas: `/products` → "Productos", `/products/:id` → "Producto > Detalle", `/products/:id/generate` → "Producto > Generar Landing"
- Clickeable para navegar hacia atrás en la jerarquía

---

## Parte 2: Mejora de Flujos de Usuario

### 2.1 ProductForm.tsx — Post-creación mejorada

- Después de crear un producto, redirigir a ProductDetail (ya lo hace)
- Sin cambios adicionales, el flujo actual es correcto

### 2.2 ProductDetail.tsx — Breadcrumbs + mejoras

- Reemplazar botón "Volver" genérico con breadcrumb: "Productos > {nombre}"
- Agregar `mx-auto` al container para centrado
- Si el producto tiene 0 landings: CTA prominente "¡Genera tu primera landing!" con animación sutil

### 2.3 GenerateLanding.tsx — Modo rápido

- Agregar tabs al inicio: "Rápido" | "Personalizado"
- **Modo Rápido**: solo muestra botón "Generar con configuración recomendada" (usa defaults: template completa, medium, clean, sin oferta)
- **Modo Personalizado**: muestra todos los controles actuales
- Default: Modo Rápido para reducir fricción

### 2.4 Landings.tsx — Migrar a sonner

- Reemplazar `useToast` por `toast` de sonner (consistencia con el resto)
- Ya identificado en la auditoría previa pero no migrado

### 2.5 Products.tsx — Skeleton loading

- Agregar estado `loading` con skeleton cards mientras se cargan los datos
- 3 skeleton cards en grid

### 2.6 Dashboard.tsx — Skeleton loading

- Agregar skeleton para stats cards y lista de landings mientras se cargan

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/components/PageBreadcrumb.tsx` | Crear |
| `src/components/AppLayout.tsx` | Modificar (agregar header desktop) |
| `src/pages/Dashboard.tsx` | Rediseño completo |
| `src/pages/Products.tsx` | Agregar skeleton loading |
| `src/pages/ProductDetail.tsx` | Breadcrumbs + centrado + CTA |
| `src/pages/GenerateLanding.tsx` | Agregar modo rápido con tabs |
| `src/pages/Landings.tsx` | Migrar a sonner |
| `src/components/AppSidebar.tsx` | Separador admin |

---

## Lo que NO cambia

- Lógica de datos y queries existentes
- Autenticación y roles
- Estilos base (colores, tipografía, sidebar theme)
- Componentes de landing editor/renderer
- Flujos de exportación y pago

