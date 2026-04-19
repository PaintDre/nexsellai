

## Objetivo

Permitir al admin **subir un archivo de video** (en lugar de solo pegar una URL) en el catálogo Dropi. El video se guarda en un bucket de Supabase Storage y la URL pública se almacena en `dropi_products.video_url` para reproducirlo/descargarlo después.

## Cambios

### 1. Storage — nuevo bucket `dropi-videos`
Migración SQL para crear bucket público (límite ~100MB, MIME `video/*`) con RLS:
- **SELECT** público (cualquiera puede ver el video).
- **INSERT/UPDATE/DELETE** solo `admin` o `super_admin`.

### 2. `src/pages/AdminDropiCatalog.tsx`
En la columna "Video" de cada producto, reemplazar el input de URL por un control con dos opciones:
- **Subir archivo** (botón con icono Upload → `<input type="file" accept="video/*">`).
- **Pegar URL** (mantener el input actual como alternativa).

Flujo de subida:
1. Validar que sea video y < 100MB.
2. `supabase.storage.from('dropi-videos').upload(<productId>/<uuid>.<ext>, file)` con barra de progreso (spinner).
3. Obtener `getPublicUrl` y hacer `update` en `dropi_products.video_url`.
4. Si ya existía un video subido en el bucket, eliminar el anterior para no acumular basura.
5. Mostrar un mini-preview `<video>` cuando ya hay video, con botón para reemplazar/eliminar.

La columna "Video" pasará a mostrar un thumbnail/check + acciones (subir, copiar URL, eliminar).

### 3. Sin cambios en `DropiProduct.tsx`
Ya consume `product.video_url` con `<video src=...>` y un botón de descarga — funcionará automáticamente con la URL pública del bucket.

### 4. i18n
Añadir claves: `dropi.uploadVideo`, `dropi.uploadingVideo`, `dropi.videoTooLarge`, `dropi.replaceVideo`, `dropi.removeVideo` en `es/en/pt`.

## Notas técnicas

- El bucket es **público** para que el `<video>` cargue sin firmar URLs (mismo patrón que `product-images` y `dropi-ads`).
- Path: `{product_id}/{uuid}.{ext}` para aislar archivos por producto.
- Se mantiene la opción de URL externa por compatibilidad con el catálogo importado vía Excel (Dropbox, etc.).
- Límite recomendado 100 MB por archivo (configurable en el bucket).

## Archivos tocados

- `supabase/migrations/...` (nuevo bucket + policies)
- `src/pages/AdminDropiCatalog.tsx`
- `src/i18n/locales/{es,en,pt}.json`

