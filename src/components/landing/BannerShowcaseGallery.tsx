import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const ImageCard = ({ url }: { url: string }) => (
  <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-all">
    <img
      src={
        url.includes("supabase.co/storage/v1/object/public/")
          ? url.replace(
              "/storage/v1/object/public/",
              "/storage/v1/render/image/public/"
            ) + "?width=400&quality=75"
          : url
      }
      alt="Banner generado por Nexsell"
      className="w-full h-auto object-contain"
      loading="lazy"
      width={400}
      height={400}
    />
  </div>
);

const Placeholder = () => (
  <div className="aspect-square rounded-xl bg-gradient-to-br from-muted to-muted/40" />
);

export const BannerShowcaseGallery = () => {
  const [images, setImages] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
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

  // Mobile: carousel
  if (isMobile) {
    return (
      <div className="mt-8 px-4">
        <Carousel opts={{ align: "center", loop: true }}>
          <CarouselContent>
            {hasImages
              ? images.map((url, i) => (
                  <CarouselItem key={i}>
                    <ImageCard url={url} />
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
      </div>
    );
  }

  // Desktop/tablet: grid
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
      {images.map((url, i) => (
        <ImageCard key={i} url={url} />
      ))}
    </div>
  );
};
