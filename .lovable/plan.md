

# Plan: Mover "Preferencias del generador" a solo admin

## Cambio

En `src/pages/SettingsPage.tsx`, envolver la card "Preferencias del generador" (líneas 199-235) con una condición que verifique si el usuario tiene rol `admin` o `super_admin` usando el hook `useAuth()` que ya expone `role`.

```tsx
{(role === "admin" || role === "super_admin") && (
  <Card>
    {/* Preferencias del generador */}
  </Card>
)}
```

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/SettingsPage.tsx` | Condicionar la sección "Preferencias del generador" a roles admin/super_admin |

Un cambio de 2 líneas. Los usuarios normales verán: Cuenta → Plan y uso → Ayuda y soporte.

