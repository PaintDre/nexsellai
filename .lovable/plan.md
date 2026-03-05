

# Plan: Restaurar botón "Nuevo Producto" en el Dashboard

## Cambio

**Archivo:** `src/pages/Dashboard.tsx` (lineas 74-79)

Agregar el botón "Nuevo Producto" de vuelta al header del Dashboard, junto al titulo. Cuando el usuario no tiene productos, mostrar tambien un mensaje guia indicando que el primer paso es crear un producto.

- Restaurar `<Button asChild><Link to="/products/new"><Plus /> Nuevo Producto</Link></Button>` al lado del titulo
- En el empty state de landings (ya existente), cambiar el texto a algo mas orientativo: "Crea tu primer producto para empezar a generar landings y banners"
- Agregar import de `Plus` de lucide-react

Un cambio minimo en un solo archivo.

