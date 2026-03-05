

# Plan: Rediseño de /banners como hub central de banners

## Problema actual

La pagina `/banners` es solo una galeria pasiva. No tiene:
- Boton para crear nuevos banners
- Filtros para organizar banners existentes
- Agrupacion por producto o por fecha
- Estadisticas basicas (total de banners, ultimo generado)
- Confirmacion antes de eliminar

El usuario tiene que ir a un producto especifico para generar banners, lo cual rompe el flujo.

## Cambios propuestos

### Archivo: `src/pages/Banners.tsx`

Redisenar completamente la pagina en 3 secciones:

**1. Header con accion principal**
- Titulo "Banners" + subtitulo con conteo total
- Boton "Generar Banners" que abre un selector de producto (dropdown/dialog con los productos del usuario) y redirige a `/products/:id/banner`
- Tabs: "Todos" | "Por Producto" para alternar vista

**2. Barra de filtros**
- Filtro por plantilla (template_id) — dropdown con las 7 plantillas
- Filtro por tamaño (output_size)
- Ordenar por: Mas reciente / Mas antiguo

**3. Grid de banners mejorado**
- Vista "Todos": grid actual pero con cards mejoradas que muestran el nombre del producto asociado
- Vista "Por Producto": banners agrupados bajo el nombre de cada producto con separador visual
- Confirmacion con AlertDialog antes de eliminar
- Seleccion multiple + "Descargar seleccionados" y "Eliminar seleccionados"

**4. Preview modal mejorado**
- Mantener navegacion con flechas (ya existe)
- Agregar indicador de posicion "3 de 12"
- Agregar boton "Eliminar" dentro del modal

### Archivo: `src/pages/Banners.tsx` — datos adicionales

- Hacer join con `products` para obtener el nombre del producto: `supabase.from("banners").select("*, products(name)")`
- Esto requiere que la foreign key `banners.product_id -> products.id` exista (verificar, si no existe crear migracion)

### Migracion SQL (si es necesario)

Verificar si `banners.product_id` tiene foreign key a `products.id`. Si no:
```sql
ALTER TABLE public.banners 
ADD CONSTRAINT banners_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
```

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Banners.tsx` | Rediseno completo: header con CTA, filtros, agrupacion, seleccion multiple, confirmacion de eliminacion |

