

# Plan: Modo Dark/Light para Todo el Sistema

## Estado Actual
- CSS variables de dark mode ya definidas en `index.css`
- Tailwind configurado con `darkMode: ["class"]`
- `next-themes` ya instalado como dependencia
- El componente `Sonner` ya usa `useTheme` de next-themes

## Cambios a Implementar

### 1. Crear ThemeProvider
Nuevo archivo `src/components/ThemeProvider.tsx`:
- Wrapper de `ThemeProvider` de next-themes
- Configurar `attribute="class"`, `defaultTheme="system"`, `enableSystem`

### 2. Envolver App con ThemeProvider
En `src/App.tsx`:
- Importar y envolver la app con `ThemeProvider`

### 3. Crear Componente ThemeToggle
Nuevo archivo `src/components/ThemeToggle.tsx`:
- Botón con iconos Sun/Moon/Monitor
- Dropdown para elegir: Light, Dark, System
- Usa `useTheme()` de next-themes

### 4. Agregar Toggle al Sidebar
En `src/components/AppSidebar.tsx`:
- Agregar `ThemeToggle` en la sección inferior del sidebar
- Versión compacta para modo collapsed

### 5. Agregar Toggle a Settings
En `src/pages/SettingsPage.tsx`:
- Nueva Card "Apariencia" con selector de tema
- Opciones: Claro, Oscuro, Sistema

## Archivos a Crear/Modificar
- `src/components/ThemeProvider.tsx` (nuevo)
- `src/components/ThemeToggle.tsx` (nuevo)
- `src/App.tsx` (agregar provider)
- `src/components/AppSidebar.tsx` (agregar toggle)
- `src/pages/SettingsPage.tsx` (agregar sección apariencia)

