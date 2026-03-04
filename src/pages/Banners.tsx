import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, ImageIcon } from "lucide-react";
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
          {banners.map((banner) => (
            <Card key={banner.id} className="group overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={banner.image_url}
                  alt="Banner"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
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
    </div>
  );
};

export default Banners;
