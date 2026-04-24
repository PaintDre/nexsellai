

# Agregar acción `export-theme` a la Edge Function

Agrego un nuevo bloque de acción en `supabase/functions/shopify-export/index.ts` para subir el archivo Liquid (`sections/nexsell-landing.liquid`) y la plantilla de producto (`templates/product.nexsell.json`) directamente al tema activo de la tienda Shopify del usuario vía Theme API.

## Cambios

**Archivo:** `supabase/functions/shopify-export/index.ts`

Inserto el bloque `if (action === "export-theme")` exactamente como lo especificaste, ubicado **después** del bloque `create-page` y **antes** del `return` final de "Invalid action". No toco los bloques existentes (`oauth-start`, `create-page`, `disconnect`).

### Lo que hace el nuevo bloque

1. **Auth check**: ya cubierto por el código superior (valida JWT y extrae `userId`).
2. **Cargar conexión Shopify**: lee `shopify_connections` con service role para obtener `store_domain` y `access_token`. Si no existe → 400.
3. **Validar payload**: requiere `liquidContent` y `templateContent` en el body. Si falta alguno → 400.
4. **Obtener tema activo**: `GET /admin/api/2024-01/themes.json` y filtra `role === "main"`. Si no hay tema principal → 400.
5. **Subir 2 assets en paralelo** vía `PUT /themes/{id}/assets.json`:
   - `sections/nexsell-landing.liquid` ← `liquidContent`
   - `templates/product.nexsell.json` ← `templateContent`
6. **Respuesta exitosa**: `{ success: true, themeName, storeDomain }`.

### Despliegue

Tras escribir el archivo, despliego la función con `supabase--deploy_edge_functions` para `shopify-export`.

## Notas / próximos pasos (no en este turno)

- El frontend todavía debe llamar a esta acción. No tocaré `src/lib/exportShopify.ts` ni la UI de exportación en este cambio — solo agregamos el endpoint server-side. Cuando confirmes que la función queda desplegada, el siguiente paso será conectar el botón de "Exportar al tema" en la UI para que invoque `shopify-export` con `{ action: "export-theme", liquidContent, templateContent }`.
- La Edge Function no requiere migraciones ni nuevos secretos: usa `SHOPIFY_API_KEY/SECRET` + el `access_token` ya almacenado en `shopify_connections` por el flujo OAuth existente.

