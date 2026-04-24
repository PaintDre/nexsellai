

# Actualizar `ExportPreviewDialog` con upload directo a Shopify

El archivo actual **solo tiene un botón** (descargar ZIP) y no contiene `handleExportToShopify`, ni estado de conexión, ni `ShopifyConnectDialog`. Las instrucciones que me pasaste asumen una versión que no existe en el repo. Para implementar lo que pediste —subir el Liquid directo al tema Shopify desde el dialog— necesito **agregar** la infraestructura completa, no solo "reemplazar la función".

## Cambios en `src/components/landing/ExportPreviewDialog.tsx`

### 1. Imports

Agregar:
- `useEffect` desde `react`
- `Upload` de `lucide-react`
- `supabase` desde `@/integrations/supabase/client`
- `useAuth` desde `@/hooks/useAuth`
- `ShopifyConnectDialog` desde `@/components/landing/ShopifyConnectDialog`
- Ampliar el import de `exportShopify` a:
  ```ts
  import { exportShopifyZip, generateShopifyLiquid, generateShopifyProductTemplate } from "@/lib/exportShopify";
  ```

Mantener intactos los imports de `generateLandingHTML` (lo usa `htmlContent` memo) — **no** se importa `normalizeImageUrl` actualmente, así que no hay nada que quitar.

### 2. Nuevo estado

```ts
const { user } = useAuth();
const [shopifyConnected, setShopifyConnected] = useState(false);
const [showConnectDialog, setShowConnectDialog] = useState(false);
const [shopifyUploading, setShopifyUploading] = useState(false);
```

### 3. `useEffect` para detectar conexión Shopify

Cuando el dialog se abre y hay `user`, consultar `shopify_connections_safe` filtrando por `user_id` y setear `shopifyConnected` (mismo patrón que ya usa `ShopifyConnectDialog.tsx`).

### 4. Nueva función `handleExportToShopify`

Exactamente la versión que pediste:
- Si no está conectado → abrir `ShopifyConnectDialog`.
- Generar `liquidContent` con `generateShopifyLiquid(blocks, product, theme, productImage, allImageUrls)`.
- Generar `templateContent` con `generateShopifyProductTemplate()`.
- Invocar `supabase.functions.invoke("shopify-export", { body: { action: "export-theme", liquidContent, templateContent }})`.
- Mostrar toast de éxito con `data.themeName` y mensaje "Asigná la plantilla `product.nexsell` a tu producto en Shopify Admin".
- Cerrar el dialog en éxito.
- Manejo de error con toast destructivo.

### 5. UI: agregar segundo botón en el footer

Dentro del bloque del footer existente, agregar **antes** del botón actual de "Descargar ZIP":

```tsx
<Button
  size="lg"
  variant="default"
  onClick={handleExportToShopify}
  disabled={shopifyUploading}
  className="w-full"
>
  {shopifyUploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
  Subir directo a Shopify
</Button>
```

Mantener el botón de descarga ZIP como fallback secundario.

### 6. Render del `ShopifyConnectDialog`

Agregar al final del componente (fuera del Dialog principal):
```tsx
<ShopifyConnectDialog
  open={showConnectDialog}
  onOpenChange={setShowConnectDialog}
  onConnected={() => { setShopifyConnected(true); setShowConnectDialog(false); }}
/>
```

## Lo que NO se toca

- `handleDownloadShopifySection` (descarga ZIP) queda intacto.
- `htmlContent` / `blobUrl` / iframe preview intactos.
- Ningún otro archivo se modifica. La Edge Function `shopify-export` con la acción `export-theme` y las funciones `generateShopifyLiquid` / `generateShopifyProductTemplate` ya existen del turno anterior.

## Notas / desviaciones de tus instrucciones

- **CHANGE 2 literal no aplica**: no existe `handleExportToShopify` que reemplazar; lo agrego nuevo junto con el estado y el botón que lo dispara.
- **CHANGE 3 (limpieza de imports)**: `generateLandingHTML` se sigue usando en el memo del iframe → se conserva. `normalizeImageUrl` no estaba importado → nada que quitar.
- Texto del nuevo botón ("Subir directo a Shopify") y toast los dejo en español hardcodeado siguiendo tu instrucción literal; si querés que pasen por i18n (`t("exportDialog.uploadDirect")` etc.) decímelo y agrego claves a `en.json`/`es.json`/`pt.json` en otro paso.

