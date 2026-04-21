import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

import { ImageGallery } from "@/components/dropi/ImageGallery";
import { AdGeneratorModal } from "@/components/dropi/AdGeneratorModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Play, Sparkles, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getDownloadUrl } from "@/lib/dropiAssets";

interface Product {
  id: string;
  name: string;
  image_main: string | null;
  image_2: string | null;
  image_3: string | null;
  video_url: string | null;
  video_2: string | null;
  video_3: string | null;
  category: string | null;
}

const DropiProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [adModalOpen, setAdModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("dropi_products")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProduct(data as Product | null);
        setLoading(false);
      });
  }, [id]);

  const images = product
    ? [product.image_main, product.image_2, product.image_3].filter(Boolean) as string[]
    : [];

  const handleDownloadImages = async () => {
    if (!images.length) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      const safeName = product!.name.replace(/\s+/g, "_");
      await Promise.all(
        images.map(async (url, i) => {
          // Use cache-friendly URL so repeated downloads hit the CDN edge.
          const res = await fetch(getDownloadUrl(url, `${safeName}_${i + 1}`), {
            cache: "force-cache",
          });
          const blob = await res.blob();
          const ext = blob.type.includes("png") ? "png" : "jpg";
          zip.file(`image_${i + 1}.${ext}`, blob);
        })
      );
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${safeName}_images.zip`);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const videos = product
    ? [product.video_url, product.video_2, product.video_3].filter(Boolean) as string[]
    : [];

  const handleDownloadVideo = (url: string, index: number) => {
    const safeName = product!.name.replace(/\s+/g, "_");
    // ?download triggers Content-Disposition: attachment from Supabase CDN
    // and gives the file a friendly name for the user.
    const downloadUrl = getDownloadUrl(url, `${safeName}_video_${index + 1}.mp4`);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.rel = "noopener";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {t("dropi.productNotFound")}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/dropi")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ImageGallery images={images} />

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">{product.name}</h1>
            {product.category && (
              <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground uppercase">
                {product.category}
              </span>
            )}
          </div>

          {videos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                {t("dropi.videos")} ({videos.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {videos.map((src, i) => (
                  <div key={i} className="space-y-2">
                    <div className="rounded-xl overflow-hidden bg-muted aspect-[9/16]">
                      <video
                        src={src}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownloadVideo(src)}
                    >
                      <Play className="mr-2 h-3.5 w-3.5" />
                      {t("dropi.downloadVideo")} {i + 1}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button className="w-full" variant="outline" onClick={handleDownloadImages} disabled={!images.length || downloading}>
              {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {t("dropi.downloadImages")}
            </Button>

            <Button className="w-full" onClick={() => setAdModalOpen(true)} disabled={!product.image_main}>
              <Sparkles className="mr-2 h-4 w-4" />
              {t("dropi.generateAds")}
            </Button>
          </div>
        </div>
      </div>

      <AdGeneratorModal
        open={adModalOpen}
        onOpenChange={setAdModalOpen}
        product={{ id: product.id, name: product.name, image_main: product.image_main }}
      />
    </div>
  );
};

export default DropiProduct;
