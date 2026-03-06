

# Plan: Fix Mobile Preview and Responsive Issues in Landing Pages

## The Problem

The screenshot shows the landing preview in "Móvil" (375px) mode with text breaking word-by-word ("Desc ubre la Liber tad sobre Rue das"). This happens because **ResizablePreview constrains the container width but CSS media queries still respond to the actual browser viewport width**. So at 375px container width, classes like `sm:text-5xl md:text-6xl` still activate because the viewport is ~1200px+, making fonts enormous inside a tiny container.

## The Fix: iframe-based Preview

Replace the current div-width-constraint approach in `ResizablePreview` with an **iframe** when a non-desktop preset is selected. The iframe's viewport matches the selected width, so all `sm:`, `md:`, `lg:` breakpoints respond correctly.

### Files to modify

#### 1. `src/components/landing/ResizablePreview.tsx` — iframe approach

- When `previewWidth > 0` (mobile/tablet), render an `<iframe>` with `srcDoc` or a portal approach
- Use a **scale transform** to fit the iframe visually: render at actual device width, scale down to fit the editor panel
- Keep the device preset bar (Móvil/Tablet/Desktop) and drag handle
- When Desktop (width=0), render children directly as today (no iframe)

**Implementation**: Use React's `createPortal` into iframe approach or `srcdoc`. The simplest reliable method:
- Render an iframe at the exact preview width
- Use `ReactDOM.createRoot` to render the LandingRenderer inside the iframe
- Copy stylesheets into the iframe head

#### 2. `src/components/landing/LandingRenderer.tsx` — Typography safety

Add responsive guards to prevent text overflow at small widths:
- Hero title: add `break-words` and reduce mobile base size from `text-4xl` to `text-3xl`
- Section titles: ensure `text-2xl` base instead of `text-3xl` for narrow screens
- CTA button text: add `text-sm sm:text-base md:text-lg` progression
- Add `overflow-hidden` to the landing container

#### 3. `src/pages/LandingView.tsx` — Pass render function to ResizablePreview

Adjust how LandingRenderer is passed to ResizablePreview so it can be re-rendered inside an iframe context.

### Technical approach for iframe preview

```text
┌─ ResizablePreview ──────────────────────┐
│  [Móvil] [Tablet] [Desktop]             │
│  ┌─────────────────────────────┐        │
│  │ <iframe width={375}>       │        │
│  │   ├─ <style> (copied CSS)  │        │
│  │   └─ <LandingRenderer />   │        │
│  │       (renders at 375px)   │        │
│  │       media queries work!  │        │
│  └─────────────────────────────┘        │
└─────────────────────────────────────────┘
```

The iframe renders at real device width. We use `transform: scale()` to fit it within the editor panel if needed.

### Alternative simpler approach: CSS Container Queries

Instead of iframes (complex with editable mode), use **CSS container queries** on the landing container:

- Wrap LandingRenderer content in a container with `container-type: inline-size`
- Replace all responsive `sm:`, `md:`, `lg:` classes in LandingRenderer with `@container` query equivalents
- This makes the landing respond to its container width, not the viewport

**Trade-off**: Container queries require rewriting all responsive classes but work perfectly with edit mode. The iframe approach is simpler initially but breaks `contentEditable` and toolbar interactions.

### Recommended: Hybrid approach

1. **For view-only previews** (non-edit mode): use iframe — perfect responsive simulation
2. **For edit mode**: keep current div approach but fix typography scaling with container queries or explicit small-width styles
3. **Always**: fix the base typography to not break at small widths

### Specific typography fixes in LandingRenderer

| Element | Current | Fixed |
|---|---|---|
| Hero h1 | `text-4xl sm:text-5xl md:text-6xl` | `text-2xl sm:text-4xl md:text-5xl lg:text-6xl` |
| Section h2 | `text-3xl md:text-4xl` | `text-xl sm:text-2xl md:text-3xl lg:text-4xl` |
| Hero subtitle | `text-lg md:text-xl` | `text-base sm:text-lg md:text-xl` |
| CTA button | `text-lg` + long text | `text-sm sm:text-base md:text-lg whitespace-nowrap` |
| Grid layouts | `sm:grid-cols-2` | Keep, but add `min-w-0` to grid children |

Also add `word-break: break-word` and `overflow-wrap: anywhere` to the landing container.

### Summary of changes

| File | Change |
|---|---|
| `ResizablePreview.tsx` | iframe-based rendering for mobile/tablet presets (view mode only) |
| `LandingRenderer.tsx` | Fix typography scale, add word-break safety, reduce base font sizes |
| `LandingView.tsx` | Pass renderContent function to ResizablePreview for iframe support |

