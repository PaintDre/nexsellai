import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download, Trash2, ImageIcon, Eye, ChevronLeft, ChevronRight,
  Plus, Filter, ArrowUpDown, CheckSquare, X,
} from "lucide-react";
import { toast } from "sonner";

interface BannerWithProduct {
  id: string;
  image_url: string;
  template_id: string;
  output_size: string;
  created_at: string;
  product_id: string | null;
  products: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  "hook-visual": "Hook Visual",
  "problema": "Problema",
  "solucion": "Solución",
  "beneficio": "Beneficio",
  "oferta": "Oferta",
  "testimonio": "Testimonio",
  "urgencia": "Urgencia",
  "oferta-directa": "Oferta Directa",
};

const Banners = () => {
  const { user } = useAuth();
  
  const navigate = useNavigate();

  const [banners, setBanners] = useState<BannerWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterTemplate, setFilterTemplate] = useState<string>("all");
  const [filterSize, setFilterSize] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Preview
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Dialogs
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);

  // Fetch data
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [bannersRes, productsRes] = await Promise.all([
      supabase
        .from("banners")
        .select("*, products(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: sortOrder === "asc" }),
      supabase
        .from("products")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name"),
    ]);
    setBanners((bannersRes.data as BannerWithProduct[]) || []);
    setProducts((productsRes.data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, sortOrder]);

  // Derived: unique templates & sizes for filters
  const uniqueTemplates = useMemo(() => [...new Set(banners.map((b) => b.template_id))], [banners]);
  const uniqueSizes = useMemo(() => [...new Set(banners.map((b) => b.output_size))], [banners]);

  // Filtered banners
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      if (filterTemplate !== "all" && b.template_id !== filterTemplate) return false;
      if (filterSize !== "all" && b.output_size !== filterSize) return false;
      return true;
    });
  }, [banners, filterTemplate, filterSize]);

  // Grouped by product
  const groupedByProduct = useMemo(() => {
    const groups: Record<string, { productName: string; banners: BannerWithProduct[] }> = {};
    filteredBanners.forEach((b) => {
      const key = b.product_id || "sin-producto";
      if (!groups[key]) {
        groups[key] = { productName: b.products?.name || "Sin producto", banners: [] };
      }
      groups[key].banners.push(b);
    });
    return Object.entries(groups);
  }, [filteredBanners]);

  // Actions
  const handleDownload = async (banner: BannerWithProduct) => {
    try {
      const response = await fetch(banner.image_url);
      if (!response.ok) throw new Error("Fetch failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `banner-${banner.template_id}-${banner.output_size}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al descargar", { description: "No se pudo descargar el banner. Intenta de nuevo." });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("banners").delete().eq("id", id);
    setBanners((prev) => prev.filter((b) => b.id !== id));
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    if (previewIndex !== null) {
      const newBanners = filteredBanners.filter((b) => b.id !== id);
      if (newBanners.length === 0) setPreviewIndex(null);
      else if (previewIndex >= newBanners.length) setPreviewIndex(newBanners.length - 1);
    }
    toast.success("Banner eliminado");
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await supabase.from("banners").delete().in("id", ids);
    setBanners((prev) => prev.filter((b) => !selectedIds.has(b.id)));
    setSelectedIds(new Set());
    setSelectionMode(false);
    toast.success(`${ids.length} banners eliminados`);
  };

  const handleBulkDownload = async () => {
    const selected = filteredBanners.filter((b) => selectedIds.has(b.id));
    for (const banner of selected) {
      await handleDownload(banner);
    }
    toast.success(`${selected.length} banners descargados`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredBanners.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBanners.map((b) => b.id)));
    }
  };

  const navigatePreview = (dir: -1 | 1) => {
    if (previewIndex === null) return;
    const next = previewIndex + dir;
    if (next >= 0 && next < filteredBanners.length) setPreviewIndex(next);
  };

  const previewBanner = previewIndex !== null ? filteredBanners[previewIndex] : null;

  // Banner card component
  const BannerCard = ({ banner, idx }: { banner: BannerWithProduct; idx: number }) => (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow relative">
      {selectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={selectedIds.has(banner.id)}
            onCheckedChange={() => toggleSelect(banner.id)}
            className="bg-background/80 backdrop-blur-sm"
          />
        </div>
      )}
      <div className="overflow-hidden bg-muted relative">
        <img
          src={banner.image_url}
          alt="Banner"
          className="w-full h-auto object-contain group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        <button
          onClick={() => setPreviewIndex(idx)}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <Eye className="h-8 w-8 text-white" />
        </button>
      </div>
      <CardContent className="p-4 space-y-2">
        {banner.products?.name && (
          <p className="text-xs font-medium text-foreground truncate">{banner.products.name}</p>
        )}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="capitalize text-xs">
            {TEMPLATE_LABELS[banner.template_id] || banner.template_id.replace("-", " ")}
          </Badge>
          <span className="text-xs text-muted-foreground">{banner.output_size}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(banner.created_at).toLocaleDateString("es-CL")}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 min-h-[44px]" onClick={() => setPreviewIndex(idx)}>
            <Eye className="h-3 w-3 mr-1" /> Ver
          </Button>
          <Button variant="outline" size="sm" className="flex-1 min-h-[44px]" onClick={() => handleDownload(banner)}>
            <Download className="h-3 w-3 mr-1" /> Bajar
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive shrink-0 min-h-[44px]" onClick={() => setDeleteTarget(banner.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold font-display tracking-tight">Banners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {banners.length} banner{banners.length !== 1 ? "s" : ""} generado{banners.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setProductSelectorOpen(true)} className="gap-2 w-full sm:w-auto min-h-[44px]">
          <Plus className="h-4 w-4" /> Generar Banners
        </Button>
      </div>

      {banners.length === 0 && !loading ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">Aún no has generado banners</p>
            <p className="text-sm text-muted-foreground mt-1">Selecciona un producto y genera tu primer banner con IA</p>
            <Button className="mt-4 gap-2" onClick={() => setProductSelectorOpen(true)}>
              <Plus className="h-4 w-4" /> Generar mi primer banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="todos" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="por-producto">Por Producto</TabsTrigger>
            </TabsList>

            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-2">
              {selectionMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    <CheckSquare className="h-3 w-3 mr-1" />
                    {selectedIds.size === filteredBanners.length ? "Deseleccionar" : "Seleccionar todo"}
                  </Button>
                  {selectedIds.size > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                        <Download className="h-3 w-3 mr-1" /> Descargar ({selectedIds.size})
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Eliminar ({selectedIds.size})
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}>
                    <X className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Select value={filterTemplate} onValueChange={setFilterTemplate}>
                    <SelectTrigger className="w-full sm:w-[150px] h-10 sm:h-8 text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las plantillas</SelectItem>
                      {uniqueTemplates.map((t) => (
                        <SelectItem key={t} value={t}>{TEMPLATE_LABELS[t] || t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterSize} onValueChange={setFilterSize}>
                    <SelectTrigger className="w-full sm:w-[130px] h-10 sm:h-8 text-xs">
                      <SelectValue placeholder="Tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tamaños</SelectItem>
                      {uniqueSizes.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSortOrder((o) => o === "desc" ? "asc" : "desc")}
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    {sortOrder === "desc" ? "Más reciente" : "Más antiguo"}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSelectionMode(true)}>
                    <CheckSquare className="h-3 w-3 mr-1" /> Seleccionar
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* All view */}
          <TabsContent value="todos">
            {filteredBanners.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay banners con estos filtros</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBanners.map((banner, idx) => (
                  <BannerCard key={banner.id} banner={banner} idx={idx} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* By product view */}
          <TabsContent value="por-producto">
            {groupedByProduct.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay banners con estos filtros</p>
            ) : (
              <div className="space-y-8">
                {groupedByProduct.map(([key, group]) => (
                  <div key={key}>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-lg font-semibold">{group.productName}</h2>
                      <Badge variant="outline" className="text-xs">{group.banners.length}</Badge>
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {group.banners.map((banner) => {
                        const globalIdx = filteredBanners.findIndex((b) => b.id === banner.id);
                        return <BannerCard key={banner.id} banner={banner} idx={globalIdx} />;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Preview Modal */}
      <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 overflow-hidden">
          {previewBanner && (
            <div className="flex flex-col">
              <div className="bg-muted flex items-center justify-center max-h-[70vh] overflow-auto relative">
                <img src={previewBanner.image_url} alt="Banner preview" className="w-full h-auto" />
                {previewIndex! > 0 && (
                  <button onClick={() => navigatePreview(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {previewIndex! < filteredBanners.length - 1 && (
                  <button onClick={() => navigatePreview(1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  {previewBanner.products?.name && (
                    <p className="text-xs text-muted-foreground">{previewBanner.products.name}</p>
                  )}
                  <p className="font-semibold text-sm capitalize">
                    {TEMPLATE_LABELS[previewBanner.template_id] || previewBanner.template_id.replace("-", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {previewBanner.output_size} · {new Date(previewBanner.created_at).toLocaleDateString("es-CL")} · {previewIndex! + 1} de {filteredBanners.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(previewBanner.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                  </Button>
                  <Button size="sm" onClick={() => handleDownload(previewBanner)}>
                    <Download className="h-4 w-4 mr-1" /> Descargar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este banner?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) handleDelete(deleteTarget); setDeleteTarget(null); }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedIds.size} banners?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { handleBulkDelete(); setBulkDeleteOpen(false); }}>
              Eliminar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product selector dialog */}
      <Dialog open={productSelectorOpen} onOpenChange={setProductSelectorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecciona un producto</DialogTitle>
          </DialogHeader>
          {products.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">No tienes productos aún</p>
              <Button className="mt-3" onClick={() => { setProductSelectorOpen(false); navigate("/products/new"); }}>
                Crear producto
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => { setProductSelectorOpen(false); navigate(`/products/${product.id}/banner`); }}
                  className="w-full text-left px-4 py-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <p className="font-medium text-sm">{product.name}</p>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Banners;
