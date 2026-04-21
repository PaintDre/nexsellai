/**
 * Helpers for Dropi catalog asset URLs.
 *
 * Goal: maximize CDN caching for free image/video downloads.
 *
 * Supabase Storage public URLs are served via the global CDN. By appending
 * Supabase image transformation params (`render/image/public/...`) we get
 * automatic WebP conversion, on-the-fly resizing AND a long
 * `cache-control: max-age=31536000, immutable` response header.
 *
 * For raw downloads (zip / direct) we keep the canonical public URL but add
 * a stable `?download=` query so the CDN can cache the response and the
 * browser receives a proper filename via `Content-Disposition`.
 */

const SUPABASE_PUBLIC_PREFIX = "/storage/v1/object/public/";
const SUPABASE_RENDER_PREFIX = "/storage/v1/render/image/public/";

const isSupabasePublicUrl = (url: string) => url.includes(SUPABASE_PUBLIC_PREFIX);

/**
 * Returns a CDN-cached, transformed image URL suitable for <img> tags.
 * Falls back to the original URL when the input isn't a Supabase public URL.
 */
export const getCachedImageUrl = (
  url: string | null | undefined,
  opts: { width?: number; quality?: number } = {},
): string => {
  if (!url) return "";
  if (!isSupabasePublicUrl(url)) return url;

  const { width = 1024, quality = 75 } = opts;
  const transformed = url.replace(SUPABASE_PUBLIC_PREFIX, SUPABASE_RENDER_PREFIX);
  const sep = transformed.includes("?") ? "&" : "?";
  return `${transformed}${sep}width=${width}&quality=${quality}&resize=contain`;
};

/**
 * Returns a thumbnail-sized cached URL.
 */
export const getCachedThumbUrl = (url: string | null | undefined): string =>
  getCachedImageUrl(url, { width: 256, quality: 70 });

/**
 * Returns a cache-friendly download URL. Adds a `download` query param so the
 * Supabase CDN responds with `Content-Disposition: attachment` and a stable
 * cache key per filename.
 */
export const getDownloadUrl = (
  url: string | null | undefined,
  filename?: string,
): string => {
  if (!url) return "";
  if (!isSupabasePublicUrl(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}download=${filename ? encodeURIComponent(filename) : ""}`;
};
