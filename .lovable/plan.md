

# Plan: Actualizar Precios y Copy de Planes

## Cambios de precios
- **Free**: se mantiene gratis
- **Starter**: $7.990 → **$14.990**/mes
- **Pro**: $14.990 → **$34.990**/mes

## Archivos a modificar

### 1. `src/pages/Index.tsx` (linea 58-61, array `plans`)

Reescribir el array con nuevos precios, cantidades de banners explicitas y copy mejorado:

```js
const plans = [
  { name: "Free", price: 0, landings: "1 landing", features: ["1 hook de venta", "2 banners / mes", "Preview de landing", "Exportar HTML basico"], popular: false },
  { name: "Starter", price: 14990, landings: "10 landings / mes", features: ["3 hooks por producto", "30 banners / mes", "Imagenes IA en landings", "Objeciones y urgencia", "FAQs editables", "Exportar HTML + CSS"], popular: true },
  { name: "Pro", price: 34990, landings: "100 landings / mes", features: ["Angulos psicologicos ilimitados", "150 banners / mes", "Hooks optimizados para ads", "Variantes de CTA", "Bundles y comparativas", "Microcopys de checkout", "Exportar ZIP completo"], popular: false },
];
```

### 2. `src/pages/Pricing.tsx` (lineas 8-60, array `plans`)

Actualizar precios, descriptions con copy mas persuasivo, y features alineadas:

- **Free**: description "Explora Nexsell sin costo" — features claras con banners incluidos
- **Starter** ($14.990): description "Ideal para lanzar y testear productos cada mes" — destacar 30 banners/mes
- **Pro** ($34.990): description "Para vendedores que escalan con ads todos los dias" — destacar 150 banners/mes

Tambien mejorar subtitulo de la pagina: "Elige el plan que mejor se adapte a tu volumen de ventas"

## Sin cambios en base de datos

Los precios mostrados son de UI. La logica de pagos con Mercado Pago se mantiene separada.

