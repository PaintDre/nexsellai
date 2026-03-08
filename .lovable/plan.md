

# Add Auto/Custom Generation Modes to GenerateBanner

## Changes to `src/pages/GenerateBanner.tsx`

### 1. Extend types and state

Add to `FormState`:
```ts
generationMode: "auto" | "custom";
bannerGoal: "sale" | "offer" | "awareness" | "benefit";
tone: "premium" | "direct" | "minimal" | "bold";
visualStyle: "auto" | "clean" | "premium" | "ecommerce" | "bold";
```

Defaults: `generationMode: "auto"`, `bannerGoal: "sale"`, `tone: "direct"`, `visualStyle: "auto"`.

### 2. Update `buildBannerPayload`

Add `generationMode` to payload always. When mode is `"custom"`, also include `bannerGoal`, `tone`, `visualStyle`. The edge function receives these but they're optional — no backend changes needed now; the extra fields are simply ignored by the current function (future enhancement can use them).

### 3. UI changes in Step 1

Insert a mode selector at the top of Step 1 (before the description textarea): two selectable cards side by side.

- **Automático**: "Rápido y simple — la IA decide la mejor dirección"
- **Personalizado**: "Más control — define el enfoque y estilo del banner"

When `custom` is selected, show 3 additional select fields below the existing inputs:
- Objetivo (bannerGoal): Venta, Oferta, Awareness, Beneficio
- Tono: Premium, Directo, Minimalista, Llamativo
- Estilo visual: Automático, Limpio, Premium, Ecommerce, Llamativo

### 4. Step 3 summary enhancement

Add mode display and, when custom, show the selected goal/tone/style in the summary grid.

### 5. No changes to

- Step structure, sequence logic, generation flow, preview modal, download, plan limits, product loading, navigation

