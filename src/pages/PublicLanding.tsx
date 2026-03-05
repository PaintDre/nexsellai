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

      // Set meta tags
      document.title = (l as any).name || "Landing Page";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", `${(l as any).name} - Landing Page`);

      // OG tags
      const setMeta = (property: string, content: string) => {
        let el = document.querySelector(`meta[property="${property}"]`);
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute("property", property);
          document.head.appendChild(el);
        }
        el.setAttribute("content", content);
      };
      setMeta("og:title", (l as any).name);
      setMeta("og:type", "website");
      setMeta("og:url", window.location.href);

      // Load product for rendering
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("id", (l as any).product_id)
        .single();
      setProduct(p);

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
      product={product ? { name: product.name, price: product.price } : null}
      imagePreview={productImage}
      theme={theme}
    />
  );
};

export default PublicLanding;
