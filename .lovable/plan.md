

# Migrar edge function a usar secret del servidor

## Cambio en `supabase/functions/generate-landing/index.ts`

- Reemplazar la lógica que lee `profile.openai_api_key` por `Deno.env.get("NexsellAi")`
- Eliminar la validación que rechaza si el usuario no tiene API key en su perfil
- Mantener la autenticación del usuario y verificación de límites de plan
- Usar el secret del servidor para todas las llamadas a OpenAI

## Cambios secundarios

- **`src/pages/SettingsPage.tsx`**: Eliminar la sección de API Key de OpenAI (ya no es necesaria)
- **`src/pages/GenerateLanding.tsx`**: Eliminar la validación `if (!profile.openai_api_key)`

Sin cambios en base de datos.

