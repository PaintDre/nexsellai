

# Polish GenerateBanner UX & Copy

## Summary
Minor UX polish pass on the existing component. No structural changes — just copy improvements, a helper text addition, and a better loading message.

## Changes (all in `src/pages/GenerateBanner.tsx`)

### 1. Mode selector copy update (lines 369, 384)
- Auto: `"Rápido y simple — la IA decide el mejor enfoque para tu producto."`
- Custom: `"Más control — define el objetivo, tono y estilo visual del banner."`

### 2. Add helper text below mode selector (after line 386)
New paragraph between mode selector and the description card:
```
"Incluso en modo automático, la IA analiza tu producto y crea una secuencia de banners optimizada para ventas."
```
Small muted text, serves as reassurance.

### 3. Loading message improvement (line 641)
Replace:
```
Generando {sequence.length} banners...
```
With:
```
Analizando tu producto y creando tu secuencia de banners...
```

### 4. Step 3 summary cleanup (lines 574-606)
- Remove the redundant "Total" column (it duplicates "Secuencia: N etapas")
- When custom mode, show Objetivo, Tono, and Estilo Visual as three separate clean cells instead of cramming Tono/Estilo into one
- Use consistent grid: 3 cols for auto, 6 cols for custom

### 5. No other changes
Everything else (validation, payload, sequence logic, preview, download, navigation, plan limits) stays exactly as-is.

