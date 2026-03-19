import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Image, Search, User, X, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface BannerWithUser {
  id: string;
  image_url: string;
  template_id: string;
  output_size: string;
  created_at: string;
  user_id: string;
  user_name: string | null;
}

const PAGE_SIZE = 6;

const AdminBannersGallery = () => {
  const { t } = useTranslation();
  const [banners, setBanners] = useState<BannerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      const { data: allBanners, error } = await supabase
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !allBanners) { setLoading(false); return; }

      const userIds = [...new Set(allBanners.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      setBanners(allBanners.map(b => ({
        ...b,
        user_name: nameMap.get(b.user_id) || null,
      })));
      setLoading(false);
    };
    fetchBanners();
  }, []);

  // Group by user
  const grouped = useMemo(() => {
    const filtered = banners.filter(b => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        b.template_id.toLowerCase().includes(q) ||
        b.output_size.toLowerCase().includes(q) ||
        (b.user_name || "").toLowerCase().includes(q)
      );
    });

    const map = new Map<string, { name: string; banners: BannerWithUser[] }>();
    for (const b of filtered) {
      const existing = map.get(b.user_id);
      if (existing) {
        existing.banners.push(b);
      } else {
        map.set(b.user_id, {
          name: b.user_name || b.user_id.slice(0, 8),
          banners: [b],
        });
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1].banners.length - a[1].banners.length);
  }, [banners, search]);

  const totalFiltered = grouped.reduce((sum, [, g]) => sum + g.banners.length, 0);

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const getVisible = (userId: string) => visibleCount[userId] || PAGE_SIZE;

  const showMore = (userId: string) => {
    setVisibleCount(prev => ({ ...prev, [userId]: (prev[userId] || PAGE_SIZE) + PAGE_SIZE }));
  };

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
            {t("settings.adminBanners.subtitle", "Banners agrupados por usuario")}
            {!loading && (
              <span className="ml-1 text-foreground font-medium">
                · {totalFiltered} banners · {grouped.length} {t("settings.adminBanners.users", "usuarios")}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("settings.adminBanners.searchPlaceholder", "Buscar por nombre, plantilla, tamaño...")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("settings.adminBanners.empty", "No se encontraron banners")}
            </p>
          ) : (
            <div className="space-y-2">
              {grouped.map(([userId, group]) => {
                const isOpen = expandedUsers.has(userId);
                const visible = getVisible(userId);
                const visibleBanners = group.banners.slice(0, visible);
                const hasMore = group.banners.length > visible;

                return (
                  <Collapsible key={userId} open={isOpen} onOpenChange={() => toggleUser(userId)}>
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full rounded-lg border bg-muted/30 hover:bg-muted/60 px-3 py-2.5 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                          <User className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm font-medium">{group.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                          {group.banners.length} banners
                        </span>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pt-2 pb-1 px-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {visibleBanners.map(banner => (
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
                                <p className="text-white/70 text-[9px]">
                                  {banner.output_size} · {banner.template_id}
                                </p>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="mt-1 h-7 text-[10px] w-full"
                                  onClick={() => handleDownload(banner.image_url, banner.id)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  {t("common.download")}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {hasMore && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-xs text-muted-foreground"
                            onClick={() => showMore(userId)}
                          >
                            {t("settings.adminBanners.showMore", "Ver más")} ({group.banners.length - visible} {t("settings.adminBanners.remaining", "restantes")})
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
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
                  <Button size="sm" onClick={() => handleDownload(previewUrl, "preview")}>
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
