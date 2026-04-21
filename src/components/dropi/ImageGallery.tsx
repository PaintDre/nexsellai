import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getCachedImageUrl, getCachedThumbUrl } from "@/lib/dropiAssets";

interface Props {
  images: string[];
}

export const ImageGallery = ({ images }: Props) => {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) return null;

  return (
    <>
      <div className="space-y-3">
        <div
          className="aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer"
          onClick={() => setLightbox(true)}
        >
          <img
            src={getCachedImageUrl(images[selected], { width: 1024 })}
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === selected ? "border-primary" : "border-transparent"
                }`}
              >
                <img
                  src={getCachedThumbUrl(img)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-3xl p-2">
          <img
            src={getCachedImageUrl(images[selected], { width: 1600, quality: 85 })}
            alt=""
            loading="eager"
            decoding="async"
            className="w-full rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
