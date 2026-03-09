

# Problema: Falta de Coherencia en Imágenes Generadas

## Diagnóstico

He analizado el edge function `generate-banner` y encontré que **sí se está enviando la imagen del producto y los datos**, pero hay problemas en cómo se están usando:

### Datos que SÍ se envían actualmente:
- ✅ Nombre del producto
- ✅ Precio formateado  
- ✅ Categoría
- ✅ Público objetivo
- ✅ Descripción (si existe)
- ✅ Primera imagen del producto (`product.images[0]`)

### Problemas identificados:

**1. Prompts genéricos sin instrucciones claras sobre la imagen del producto**
Los templates (hook-visual, problema, solución, etc.) NO instruyen específicamente a la IA para que:
- Use la imagen del producto real como elemento central
- Mantenga los colores y estilo del producto original
- Integre el producto de forma realista en la composición

**2. Falta de contexto visual explícito**
El prompt actual dice:
```
"El producto debe ser el protagonista visual de la escena"
```

Pero NO dice:
```
"USAR LA IMAGEN DEL PRODUCTO PROPORCIONADA como elemento principal. 
Extraer colores, texturas y estilo del producto real. 
NO recrear el producto desde cero."
```

**3. Templates inconsistentes**
Algunos templates piden "persona enfrentando problema" o "persona usando producto", pero no hay instrucciones claras de cómo combinar esto con la imagen real del producto.

## Solución Propuesta

### Cambio 1: Agregar instrucción explícita de imagen del producto
En el `SYSTEM_PROMPT` (línea 27), agregar al inicio:

```
CRITICAL: Una imagen del producto real está incluida en este prompt. 
DEBES usar esa imagen exacta del producto como referencia visual principal.

Analiza la imagen del producto para:
- Extraer la paleta de colores dominante
- Identificar el estilo visual (moderno, clásico, tecnológico, natural, etc.)
- Mantener proporciones y características reales del producto
- Integrar el producto de forma natural en la composición

NO RECREAR el producto desde cero. USA la imagen proporcionada.
```

### Cambio 2: Mejorar cada template individual
Para cada template, agregar instrucciones específicas sobre cómo usar la imagen del producto:

**Ejemplo - template "problema":**
```
COMPOSICIÓN DEL PRODUCTO:
- Colocar la imagen real del producto en una esquina o lateral (30-40% del espacio)
- Mostrar en efecto "antes/sin producto" con persona enfrentando dificultad
- Mantener colores del producto visibles pero no dominantes en esta etapa
```

**Ejemplo - template "solucion":**
```
COMPOSICIÓN DEL PRODUCTO:
- Usar la imagen real del producto como elemento central (50-60% del espacio)
- Mostrar el producto en uso o siendo aplicado
- Extraer colores dominantes del producto para el fondo y elementos visuales
- Agregar destellos o brillos que complementen los colores del producto
```

### Cambio 3: Agregar instrucción de consistencia en secuencias
Cuando `sequencePosition` existe, agregar:

```
CRITICAL: Mantener CONSISTENCIA VISUAL con banners anteriores:
- Usar la misma paleta de colores del producto
- Mantener el mismo estilo fotográfico
- Variar solo el ángulo y composición, no el estilo general
```

### Cambio 4: Enviar más contexto del producto
Mejorar las líneas 486-492 para incluir:

```typescript
const textPrompt = `Generate a professional ecommerce marketing banner image.

PRODUCT DATA:
- Name: ${product.name}
- Price: ${priceFormatted}
- Category: ${product.category}
- Target Audience: ${product.target_audience}
${benefitsText}

CRITICAL IMAGE INSTRUCTION:
A real product image is included below. You MUST use this exact product image as the primary visual element. 
Analyze its colors, style, and characteristics. Do NOT recreate the product from scratch.
Extract the dominant color palette from the product image and use it throughout the banner composition.

BANNER DIMENSIONS: ${width}x${height} pixels
...
```

### Cambio 5: Verificar que la imagen del producto se está cargando
Agregar logging para confirmar que `product.images[0]` existe:

```typescript
if (product.images && product.images.length > 0) {
  console.log("✅ Product image URL:", product.images[0]);
  userContent.push({
    type: "image_url",
    image_url: { url: product.images[0] },
  });
} else {
  console.warn("⚠️ No product image provided for:", product.name);
}
```

## Resultado Esperado

Con estos cambios, la IA recibirá instrucciones claras de:
1. **Usar la imagen real del producto** como base visual
2. **Extraer colores y estilo** del producto para mantener coherencia
3. **Mantener consistencia visual** entre banners de una secuencia
4. **Integrar el producto** de forma natural según la etapa del funnel

Esto debería eliminar el problema de imágenes genéricas o inconsistentes que no representan el producto real.

