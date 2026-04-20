import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LandingRenderer from "@/components/landing/LandingRenderer";
import { type LandingTheme } from "@/components/landing/themes";

const PublicLanding = () => {
  const { slug } = useParams();
  const [landing, setLanding] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const { data: l, error } = await (supabase
        .from("landings")
        .select("*") as any)
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error || !l) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLanding(l);

      // Load product for OG image
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("id", (l as any).product_id)
        .single();
      setProduct(p);

      // Build OG image from product
      let ogImage = "";
      if (p?.images?.[0]) {
        ogImage = p.images[0].startsWith("http")
          ? p.images[0]
          : supabase.storage.from("product-images").getPublicUrl(p.images[0]).data?.publicUrl || "";
      }

      // Extract hero content for description
      const heroBlock = ((l as any).blocks as any[])?.find((b: any) => b.type === "hero");
      const description = typeof heroBlock?.content === "string"
        ? heroBlock.content.slice(0, 160)
        : p?.description?.slice(0, 160) || `${(l as any).name} - Landing Page`;

      // Set document title
      document.title = `${(l as any).name} | ${p?.name || "Landing Page"}`;

      // Helper to set/create meta tags
      const setMeta = (attr: string, key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`);
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute(attr, key);
          document.head.appendChild(el);
        }
        el.setAttribute("content", content);
      };

      // Standard meta
      setMeta("name", "description", description);
      setMeta("name", "robots", "index, follow");

      // Open Graph
      setMeta("property", "og:title", (l as any).name);
      setMeta("property", "og:description", description);
      setMeta("property", "og:type", "website");
      setMeta("property", "og:url", window.location.href);
      if (ogImage) setMeta("property", "og:image", ogImage);
      setMeta("property", "og:site_name", (l as any).name);

      // Twitter Card
      setMeta("name", "twitter:card", ogImage ? "summary_large_image" : "summary");
      setMeta("name", "twitter:title", (l as any).name);
      setMeta("name", "twitter:description", description);
      if (ogImage) setMeta("name", "twitter:image", ogImage);

      // Canonical URL
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", window.location.href);

      // Track view
      await supabase.from("landing_views" as any).insert({
        landing_id: (l as any).id,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      } as any);

      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold text-foreground">Página no encontrada</h1>
        <p className="text-muted-foreground">Esta landing no existe o no está publicada.</p>
      </div>
    );
  }

  const blocks = (landing?.blocks as any[]) || [];
  const theme = ((landing as any)?.theme || "clean") as LandingTheme;
  const productImage = product?.images?.[0]?.startsWith("http")
    ? product.images[0]
    : product?.images?.[0]
      ? supabase.storage.from("product-images").getPublicUrl(product.images[0]).data?.publicUrl
      : null;

  return (
    <LandingRenderer
      blocks={blocks}
      product={product ? { name: product.name, price: product.price, category: product.category } : null}
      imagePreview={productImage}
      theme={theme}
      hasOffer={!!(landing as any).has_offer}
      countryCode={(landing as any)?.country_code || (product as any)?.country_code || null}
    />
  );
};

export default PublicLanding;
