

# Iteracion 5: Eliminacion de landings, selector de temas en tiempo real, estadisticas de uso

## 1. Eliminacion de landings con confirmacion

**En `src/pages/Landings.tsx`:**
- Agregar boton Trash en cada card (junto a Copy y Download)
- Estado `deletingId` para tracking
- `AlertDialog` de confirmacion: "Esta accion no se puede deshacer. Se eliminaran tambien las versiones guardadas."
- Handler `handleDelete`: `supabase.from("landings").delete().eq("id", id).eq("user_id", user.id)`, luego filtrar del estado local

**En `src/pages/LandingView.tsx`:**
- Agregar boton "Eliminar" (Trash icon) en la barra superior
- Mismo AlertDialog de confirmacion
- Tras eliminar, `navigate("/landings")`

## 2. Selector de temas en tiempo real (con persistencia)

**En `src/pages/LandingView.tsx`:**
- El selector de tema ya existe (linea 380-389) pero NO persiste el cambio en la base de datos
- Agregar `onValueChange` que ademas de `setTheme`, haga un `supabase.from("landings").update({ theme }).eq("id", landing.id)` y actualice el estado local de `landing`
- Agregar preview visual en el selector: mostrar un mini color swatch junto al nombre del tema usando los colores de `ThemeConfig` (ctaBg color dot)

## 3. Estadisticas de uso en el Dashboard

**En `src/pages/Dashboard.tsx`:**
- Agregar una cuarta card de stats: "Versiones guardadas" con count de `landing_versions`
- Agregar seccion "Actividad reciente" debajo de landings recientes: muestra las ultimas 5 ediciones (de `landing_versions`) con fecha y nombre de la landing asociada
- Agregar badge visual en la card de "Landings Usadas" con barra de progreso (componente Progress) mostrando used/limit

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Landings.tsx` | Boton eliminar + AlertDialog confirmacion |
| `src/pages/LandingView.tsx` | Boton eliminar + persistencia de tema en tiempo real |
| `src/pages/Dashboard.tsx` | Stats de versiones + barra de progreso + actividad reciente |

