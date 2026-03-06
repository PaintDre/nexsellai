import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { ZoomIn } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const ImageCard = ({ url, onZoom }: { url: string; onZoom: () => void }) => (
  <div
    className="relative rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all bg-muted flex items-center justify-center cursor-pointer group"
    onClick={onZoom}
  >
    <img
      src={
        url.includes("supabase.co/storage/v1/object/public/")
          ? url.replace(
              "/storage/v1/object/public/",
              "/storage/v1/render/image/public/"
            ) + "?width=800&quality=80"
          : url
      }
      alt="Banner generado por Nexsell"
      className="w-full h-auto object-contain rounded-xl"
      loading="lazy"
    />
    <button
      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      aria-label="Ver imagen completa"
      onClick={(e) => { e.stopPropagation(); onZoom(); }}
    >
      <ZoomIn className="h-4 w-4" />
    </button>
  </div>
);

const Placeholder = () => (
  <div className="aspect-square rounded-xl bg-gradient-to-br from-muted to-muted/40" />
);

export const BannerShowcaseGallery = () => {
  const [images, setImages] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase
      .from("banners")
      .select("image_url")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setImages(data.map((b) => b.image_url));
        }
        setLoaded(true);
      });
  }, []);

  if (!loaded) return null;

  const hasImages = images.length > 0;

  const getHighResUrl = (url: string) =>
    url.includes("supabase.co/storage/v1/object/public/")
      ? url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") + "?width=1200&quality=90"
      : url;

  const previewDialog = (
    <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl p-2 sm:p-4 bg-black/95 border-none">
        <DialogTitle className="sr-only">Vista previa del banner</DialogTitle>
        {selectedImage && (
          <img
            src={getHighResUrl(selectedImage)}
            alt="Vista previa del banner"
            className="w-full max-h-[90vh] object-contain rounded-lg"
          />
        )}
      </DialogContent>
    </Dialog>
  );

  if (isMobile) {
    return (
      <div className="mt-8 px-4">
        <Carousel opts={{ align: "center", loop: true }}>
          <CarouselContent>
            {hasImages
              ? images.map((url, i) => (
                  <CarouselItem key={i} className="basis-full">
                    <ImageCard url={url} onZoom={() => setSelectedImage(url)} />
                  </CarouselItem>
                ))
              : [1, 2, 3].map((i) => (
                  <CarouselItem key={i}>
                    <Placeholder />
                  </CarouselItem>
                ))}
          </CarouselContent>
          <CarouselPrevious className="-left-2" />
          <CarouselNext className="-right-2" />
        </Carousel>
        {previewDialog}
      </div>
    );
  }

  if (!hasImages) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <Placeholder key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {images.map((url, i) => (
          <ImageCard key={i} url={url} onZoom={() => setSelectedImage(url)} />
        ))}
      </div>
      {previewDialog}
    </>
  );
};