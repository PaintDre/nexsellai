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

interface Product {
  id: string;
  name: string;
  image_main: string | null;
  image_2: string | null;
  image_3: string | null;
  video_url: string | null;
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
      await Promise.all(
        images.map(async (url, i) => {
          const res = await fetch(url);
          const blob = await res.blob();
          const ext = blob.type.includes("png") ? "png" : "jpg";
          zip.file(`image_${i + 1}.${ext}`, blob);
        })
      );
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${product!.name.replace(/\s+/g, "_")}_images.zip`);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!product?.video_url) return;
    window.open(product.video_url, "_blank");
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
          {/* Gallery */}
          <ImageGallery images={images} />

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">{product.name}</h1>
              {product.category && (
                <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground uppercase">
                  {product.category}
                </span>
              )}
            </div>

            {/* Video */}
            {product.video_url && (
              <div className="rounded-xl overflow-hidden bg-muted">
                <video
                  src={product.video_url}
                  controls
                  className="w-full max-h-80 object-contain"
                  preload="metadata"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                className="w-full"
                variant="outline"
                onClick={handleDownloadImages}
                disabled={!images.length || downloading}
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t("dropi.downloadImages")}
              </Button>

              {product.video_url && (
                <Button className="w-full" variant="outline" onClick={handleDownloadVideo}>
                  <Play className="mr-2 h-4 w-4" />
                  {t("dropi.downloadVideo")}
                </Button>
              )}

              <Button className="w-full" onClick={() => setAdModalOpen(true)} disabled={!product.image_main}>
                <Sparkles className="mr-2 h-4 w-4" />
                {t("dropi.generateAds")}
              </Button>
            </div>
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
