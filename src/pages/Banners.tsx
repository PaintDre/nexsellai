import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, Trash2, ImageIcon, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Banner {
  id: string;
  image_url: string;
  template_id: string;
  output_size: string;
  created_at: string;
  product_id: string | null;
}

const Banners = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const fetchBanners = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("banners")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setBanners((data as Banner[]) || []);
  };

  useEffect(() => { fetchBanners(); }, [user]);

  const handleDownload = async (banner: Banner) => {
    const response = await fetch(banner.image_url);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banner-${banner.template_id}-${banner.output_size}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("banners").delete().eq("id", id);
    setBanners((prev) => prev.filter((b) => b.id !== id));
    toast({ title: "Banner eliminado" });
  };

  const previewBanner = previewIndex !== null ? banners[previewIndex] : null;

  const navigatePreview = (dir: -1 | 1) => {
    if (previewIndex === null) return;
    const next = previewIndex + dir;
    if (next >= 0 && next < banners.length) setPreviewIndex(next);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold font-display tracking-tight">Banners</h1>

      {banners.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aún no has generado banners</p>
            <p className="text-sm text-muted-foreground mt-1">Ve a un producto y genera tu primer banner con IA</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner, idx) => (
            <Card key={banner.id} className="group overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square overflow-hidden bg-muted relative">
                <img
                  src={banner.image_url}
                  alt="Banner"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
                {/* Preview overlay on hover */}
                <button
                  onClick={() => setPreviewIndex(idx)}
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <Eye className="h-8 w-8 text-white" />
                </button>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="capitalize text-xs">
                    {banner.template_id.replace("-", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{banner.output_size}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(banner.created_at).toLocaleDateString("es-CL")}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewIndex(idx)}>
                    <Eye className="h-3 w-3 mr-1" /> Vista previa
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDownload(banner)}>
                    <Download className="h-3 w-3 mr-1" /> Descargar
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => handleDelete(banner.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {previewBanner && (
            <div className="flex flex-col">
              <div className="bg-muted flex items-center justify-center max-h-[70vh] overflow-auto relative">
                <img
                  src={previewBanner.image_url}
                  alt="Banner preview"
                  className="w-full h-auto"
                />
                {/* Navigation arrows */}
                {previewIndex! > 0 && (
                  <button
                    onClick={() => navigatePreview(-1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {previewIndex! < banners.length - 1 && (
                  <button
                    onClick={() => navigatePreview(1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm capitalize">
                    {previewBanner.template_id.replace("-", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {previewBanner.output_size} · {new Date(previewBanner.created_at).toLocaleDateString("es-CL")}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleDownload(previewBanner)}>
                  <Download className="h-4 w-4 mr-2" /> Descargar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Banners;
