import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Image, Search, User, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface BannerWithUser {
  id: string;
  image_url: string;
  template_id: string;
  output_size: string;
  created_at: string;
  user_id: string;
  user_name: string | null;
  user_email?: string;
}

const AdminBannersGallery = () => {
  const { t } = useTranslation();
  const [banners, setBanners] = useState<BannerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uniqueUsers = Array.from(
    new Map(banners.map(b => [b.user_id, { id: b.user_id, name: b.user_name || b.user_id.slice(0, 8) }])).values()
  );

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      const { data: allBanners, error } = await supabase
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !allBanners) {
        setLoading(false);
        return;
      }

      const userIds = [...new Set(allBanners.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      const enriched: BannerWithUser[] = allBanners.map(b => ({
        ...b,
        user_name: nameMap.get(b.user_id) || null,
      }));

      setBanners(enriched);
      setLoading(false);
    };

    fetchBanners();
  }, []);

  const filtered = banners.filter(b => {
    if (filterUser !== "all" && b.user_id !== filterUser) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.template_id.toLowerCase().includes(q) ||
        b.output_size.toLowerCase().includes(q) ||
        (b.user_name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownload = async (url: string, id: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `banner-${id.slice(0, 8)}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            {t("settings.adminBanners.title", "Todos los banners")}
          </CardTitle>
          <CardDescription>
            {t("settings.adminBanners.subtitle", "Banners creados por todos los usuarios de la plataforma")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t("settings.adminBanners.searchPlaceholder", "Buscar por plantilla, tamaño...")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
                <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder={t("settings.adminBanners.allUsers", "Todos los usuarios")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("settings.adminBanners.allUsers", "Todos los usuarios")}</SelectItem>
                {uniqueUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("settings.adminBanners.count", "{{count}} banners", { count: filtered.length })}
          </p>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("settings.adminBanners.empty", "No se encontraron banners")}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map(banner => (
                <div
                  key={banner.id}
                  className="group relative rounded-lg overflow-hidden border bg-muted/30 hover:border-primary/50 transition-colors"
                >
                  <img
                    src={banner.image_url}
                    alt={`Banner ${banner.template_id}`}
                    className="w-full aspect-square object-cover cursor-pointer"
                    onClick={() => setPreviewUrl(banner.image_url)}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-white text-[10px] font-medium truncate">
                      {banner.user_name || "Sin nombre"}
                    </p>
                    <p className="text-white/70 text-[9px]">
                      {banner.output_size} · {banner.template_id}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-1.5 h-7 text-[10px] w-full"
                      onClick={() => handleDownload(banner.image_url, banner.id)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {t("common.download")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl p-1">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {previewUrl && (
              <>
                <img src={previewUrl} alt="Banner preview" className="w-full rounded-lg" />
                <div className="p-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleDownload(previewUrl, "preview")}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    {t("common.download")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminBannersGallery;
