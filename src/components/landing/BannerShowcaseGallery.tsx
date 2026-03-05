import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const BannerShowcaseGallery = () => {
  const [images, setImages] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

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

  if (images.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-gradient-to-br from-muted to-muted/40"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
      {images.map((url, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
        >
          <img
            src={url}
            alt=""
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};
