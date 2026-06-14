import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Video as VideoIcon, Sparkles, Download, Trash2, Loader2, Plus, Play, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/EmptyState";

interface ProductLite {
  id: string;
  name: string;
  images: string[] | null;
}

interface ProductVideo {
  id: string;
  product_id: string | null;
  source_image_url: string;
  prompt: string;
  style: string;
  status: string;
  video_url: string | null;
  thumbnail_url: string | null;
  aspect_ratio: string;
  duration_sec: number;
  credits_charged: number;
  error_message: string | null;
  created_at: string;
}

const STYLES = [
  { id: "showcase", label: "Showcase cinematográfico", desc: "Cámara orbita suave, luz de estudio premium" },
  { id: "unboxing", label: "Unboxing", desc: "Manos presentando el producto" },
  { id: "lifestyle", label: "Lifestyle", desc: "Producto en escena natural, hora dorada" },
  { id: "dynamic", label: "Dinámico / Ads", desc: "Zoom enérgico, luces, ideal anuncios" },
];

const Videos = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [videos, setVideos] = useState<ProductVideo[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [style, setStyle] = useState<string>("showcase");
  const [extra, setExtra] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchVideos = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("product_videos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setVideos((data ?? []) as ProductVideo[]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [vRes, pRes] = await Promise.all([
        (supabase as any).from("product_videos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, images").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setVideos((vRes.data ?? []) as ProductVideo[]);
      setProducts((pRes.data ?? []) as ProductLite[]);
      setLoading(false);
    })();
  }, [user]);

  // Poll in-progress videos every 8s
  useEffect(() => {
    const pending = videos.filter((v) => v.status === "queued" || v.status === "in_progress");
    if (pending.length === 0) return;
    const interval = setInterval(async () => {
      for (const v of pending) {
        try {
          await supabase.functions.invoke("check-product-video", { body: { video_id: v.id } });
        } catch (e) {
          console.error("poll error", e);
        }
      }
      await fetchVideos();
    }, 8000);
    return () => clearInterval(interval);
  }, [videos, fetchVideos]);

  const handleSubmit = async () => {
    if (!productId) {
      toast.error("Selecciona un producto");
      return;
    }
    const product = products.find((p) => p.id === productId);
    const image = product?.images?.[0];
    if (!image) {
      toast.error("El producto no tiene imagen");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("generate-product-video", {
      body: { product_id: productId, image_url: image, style, extra_prompt: extra },
    });
    setSubmitting(false);
    if (error || data?.error) {
      const msg = (data as any)?.error ?? error?.message ?? "error";
      if (msg === "insufficient_credits") {
        toast.error("Créditos insuficientes", { description: "Mejora tu plan para generar más videos." });
      } else {
        toast.error("Error generando video", { description: String(msg) });
      }
      return;
    }
    toast.success("Video en cola", { description: "Te avisamos cuando esté listo (60-180s)." });
    setOpen(false);
    setExtra("");
    await fetchVideos();
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("product_videos").delete().eq("id", id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
    toast.success("Video eliminado");
  };

  const productsWithImages = products.filter((p) => p.images && p.images.length > 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <VideoIcon className="h-6 w-6 text-primary" />
            Videos IA
            <Badge className="bg-amber/15 text-amber border-amber/30">Higgsfield</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Convierte una foto de producto en un video cinemático listo para Instagram, TikTok o anuncios.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={productsWithImages.length === 0} size="lg">
          <Plus className="h-4 w-4" /> Crear video
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={VideoIcon}
          title="Aún no tienes videos"
          description={
            productsWithImages.length === 0
              ? "Primero crea un producto con imagen para poder generar videos."
              : "Genera tu primer video desde una foto de producto (40 créditos)."
          }
          action={productsWithImages.length > 0 ? { label: "Crear primer video", onClick: () => setOpen(true), icon: Plus } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <div className="relative bg-muted aspect-[9/16]">
                {v.status === "completed" && v.video_url ? (
                  <video
                    src={v.video_url}
                    poster={v.thumbnail_url ?? undefined}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : v.status === "failed" || v.status === "nsfw" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {v.error_message ?? "Generación fallida. Créditos devueltos."}
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                    <p className="text-xs font-medium text-foreground">
                      {v.status === "queued" ? "En cola..." : "Generando..."}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">~60-180s</p>
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="font-medium capitalize">{v.style}</span>
                  <span className="text-muted-foreground">· {v.duration_sec}s</span>
                </div>
                <div className="flex gap-2">
                  {v.status === "completed" && v.video_url && (
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <a href={v.video_url} download={`nexsell-video-${v.id}.mp4`} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5" /> MP4
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(v.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Generar video con IA
            </DialogTitle>
            <DialogDescription>
              Higgsfield convertirá la foto principal del producto en un video de {5}s. Costo: 40 créditos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Producto</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un producto" /></SelectTrigger>
                <SelectContent>
                  {productsWithImages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Estilo</Label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`text-left p-2.5 rounded-lg border transition-all ${
                      style === s.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <p className="text-xs font-semibold">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Instrucción extra (opcional)</Label>
              <Textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Ej: cámara haciendo zoom suave, fondo color esmeralda"
                rows={2}
                maxLength={200}
              />
            </div>

            <Button onClick={handleSubmit} disabled={submitting || !productId} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4" /> Generar (40 créditos)</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Videos;