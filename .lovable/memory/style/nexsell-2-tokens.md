---
name: Nexsell 2.0 design tokens
description: New brand accents added in Fase 1 — amber CTA, evolved dark navy, Sora+Manrope fonts
type: design
---
Paleta Nexsell 2.0 (Fase 1):
- Primary (Emerald): `--primary: 152 55% 45%` (dark) / `152 55% 38%` (light)
- Amber CTA: `--amber: 38 92% 50%` (light) / `38 95% 55%` (dark). Utility class `.cta-amber` con gradient + shadow-amber.
- Backgrounds dark: `215 28% 7%` (bg), `220 24% 10%` (card)
- Fonts: Sora (display/headings) + Manrope (body). Cargados via index.html.
- Utilities: `.bg-mesh-hero`, `.bg-grid-dark`, `.cta-amber`, `.text-amber-brand`, `.generating-bar`, `.cursor-trail`
- Gradients custom: `--gradient-cta` (amber), `--gradient-emerald`, `--gradient-hero`
- Public landing (`Index.tsx`) fuerza `.dark` siempre — marca es dark-first.
- CTAs primarios del marketing: usar amber. Acciones internas del app: seguir con primary (Emerald).