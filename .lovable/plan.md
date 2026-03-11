

# Plan: Sidebar Hover-to-Expand + Glassmorphism Cards — Estilo Apple

## Resumen
Sidebar que se mantiene colapsado (solo iconos) por defecto y se expande temporalmente al hacer hover. Cards con glassmorphism sutil (fondo semi-transparente, backdrop-blur, bordes difusos) en todo el sistema.

## 1. Sidebar Hover-to-Expand

**Archivo:** `src/components/AppSidebar.tsx` + `src/components/AppLayout.tsx`

Comportamiento:
- Desktop: sidebar siempre visible en modo colapsado (60px, solo iconos)
- Al hacer `onMouseEnter` en el `<aside>`, se expande a 240px con transición suave (300ms ease-out)
- Al hacer `onMouseLeave`, vuelve a 60px
- El sidebar expandido se posiciona como overlay (`absolute/fixed`) para no empujar el contenido
- Tablet: mismo comportamiento hover
- Mobile: mantiene el Sheet actual (hamburguesa)

Detalles técnicos:
- Estado `hovered` con `useState` en `AppSidebar`
- `onMouseEnter`/`onMouseLeave` en el `<aside>`
- Cuando `hovered=true`: sidebar se expande sobre el contenido con `position: fixed` + `z-50` + sombra
- Transición CSS: `transition-all duration-300 ease-out`
- Eliminar la prop `collapsed` de `AppLayout` — ahora siempre es collapsed, hover lo expande

## 2. Glassmorphism en Cards

**Archivos:** `src/components/ui/card.tsx` + `src/index.css`

Cambios en Card base:
- Fondo: `bg-card/70 backdrop-blur-xl` (semi-transparente con blur)
- Bordes: `border-white/10 dark:border-white/5` (ultra sutiles)
- Sombra: `shadow-sm` suave, en hover `shadow-lg shadow-black/5`
- Transición suave de 300ms en hover

CSS utility class `.glass-card`:
```css
.glass-card {
  @apply bg-card/70 backdrop-blur-xl border-white/10 shadow-sm;
}
```

## 3. Refinamientos Apple adicionales

**Dashboard, Products, Landings, Admin, Settings, Pricing:**
- Cards de stats con efecto glass
- Bordes más sutiles en toda la app (`border-border/40` en lugar de `border-border`)
- Hover states más suaves con `duration-300 ease-out`
- Quick Action cards con glass effect

**Header (`AppLayout.tsx`):**
- Más glass en la barra superior: `bg-background/60 backdrop-blur-xl`
- Borde inferior casi invisible: `border-border/30`

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/AppSidebar.tsx` | Hover-to-expand con onMouseEnter/Leave, fixed overlay |
| `src/components/AppLayout.tsx` | Simplificar: sidebar siempre collapsed, quitar lógica tablet vs desktop |
| `src/components/ui/card.tsx` | Glassmorphism base: bg-card/70 backdrop-blur-xl |
| `src/index.css` | Utility class .glass-card, bordes sutiles globales |
| `src/pages/Dashboard.tsx` | Aplicar glass a cards, transiciones 300ms |
| `src/pages/AdminDashboard.tsx` | Glassmorphism en stats cards |
| `src/pages/Products.tsx` | Glass cards |
| `src/pages/Landings.tsx` | Glass cards |
| `src/pages/Pricing.tsx` | Glass en plan cards |
| `src/pages/SettingsPage.tsx` | Glass en setting cards |

