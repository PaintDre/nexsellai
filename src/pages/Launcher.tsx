import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Rocket, Package, CheckCircle2, Image as ImageIcon, Video, User, Download, Loader2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type Product = Tables<"products">;
type LaunchJob = Tables<"launch_jobs">;

const STEPS = [
  { key: "product", label: "Producto", icon: Package },
  { key: "banners", label: "Banners", icon: ImageIcon },
  { key: "video", label: "Video", icon: Video },
  { key: "influencer", label: "Influencer", icon: User },
  { key: "kit", label: "Kit", icon: Download },
];

function stepState(job: LaunchJob | null, stepKey: string) {
  if (!job) return "idle" as const;
  const completed = (job.steps_completed as Record<string, boolean>) || {};
  if (completed[stepKey]) return "done" as const;
  if (job.status === "failed" && job.current_step === stepKey) return "error" as const;
  if (job.status === "running" && job.current_step === stepKey) return "active" as const;
  return "idle" as const;
}

export default function Launcher() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<LaunchJob | null>(null);
  const [launching, setLaunching] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [user]);

  // Realtime subscription to current job
  useEffect(() => {
    if (!job?.id) return;
    const channel = supabase
      .channel(`launch_job_${job.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "launch_jobs", filter: `id=eq.${job.id}` },
        (payload) => {
          setJob(payload.new as LaunchJob);
        },
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [job?.id]);

  const handleLaunch = async () => {
    if (!selected) return;
    setLaunching(true);
    setJob(null);
    try {
      const { data, error } = await supabase.functions.invoke("launch-campaign", {
        body: { productId: selected.id },
      });
      if (error) throw error;
      if (data?.jobId) {
        // Pull the row so realtime subscription starts
        const { data: j } = await supabase
          .from("launch_jobs")
          .select("*")
          .eq("id", data.jobId)
          .maybeSingle();
        if (j) setJob(j);
        toast.success("Banners generados");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "No se pudo lanzar la campaña");
    } finally {
      setLaunching(false);
    }
  };

  const banners = ((job?.assets as { banners?: string[] } | null)?.banners) ?? [];
  const bannersDone = Boolean(
    (job?.steps_completed as Record<string, boolean> | null)?.banners,
  );
  const isGeneratingBanners =
    launching || (job?.status === "running" && job?.current_step === "banners");

  const assets = (job?.assets ?? {}) as {
    banners?: string[];
    product_video_id?: string;
    video_url?: string;
    video_thumbnail?: string;
  };
  const videoDone = Boolean(
    (job?.steps_completed as Record<string, boolean> | null)?.video,
  );
  const isGeneratingVideo =
    job?.status === "running" && job?.current_step === "video";

  // Poll product_videos while video step is in-flight
  useEffect(() => {
    if (!job?.id || !assets.product_video_id) return;
    if (videoDone || assets.video_url) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const { data } = await supabase.functions.invoke("check-product-video", {
          body: { video_id: assets.product_video_id },
        });
        const v = (data as any)?.video;
        if (!v || cancelled) return;
        if (v.status === "completed" && v.video_url) {
          const newAssets = {
            ...assets,
            video_url: v.video_url,
            video_thumbnail: v.thumbnail_url ?? null,
          };
          const newSteps = {
            ...((job.steps_completed as Record<string, boolean>) || {}),
            video: true,
          };
          await supabase
            .from("launch_jobs")
            .update({
              assets: newAssets,
              steps_completed: newSteps,
              current_step: "influencer",
              status: "running",
            })
            .eq("id", job.id);
        } else if (v.status === "failed" || v.status === "nsfw") {
          await supabase
            .from("launch_jobs")
            .update({
              status: "failed",
              error_message: `video:${v.error_message ?? v.status}`,
            })
            .eq("id", job.id);
        }
      } catch (e) {
        console.error("poll product video", e);
      }
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [job?.id, assets.product_video_id, videoDone, assets.video_url]);

  const handleGenerateVideo = async () => {
    if (!selected || !job?.id) return;
    try {
      const { data, error } = await supabase.functions.invoke("launch-campaign", {
        body: { productId: selected.id, jobId: job.id, step: "video" },
      });
      if (error) throw error;
      toast.success("Video en cola, generando…");
      // Re-fetch job to pick up product_video_id immediately
      const { data: j } = await supabase
        .from("launch_jobs")
        .select("*")
        .eq("id", job.id)
        .maybeSingle();
      if (j) setJob(j);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "No se pudo iniciar el video");
    }
  };

  return (
    <div className="page-in p-5 md:p-8 lg:p-10 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            Agente Lanzador
          </h1>
          <p className="text-sm text-muted-foreground">
            Genera todo el kit de campaña en un solo flujo: banners, video, influencer y descarga.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {STEPS.map((s, i) => {
              const st = stepState(job, s.key);
              const ring =
                st === "done"
                  ? "bg-primary text-primary-foreground border-primary"
                  : st === "active"
                  ? "bg-primary/10 text-primary border-primary animate-pulse"
                  : st === "error"
                  ? "bg-destructive/10 text-destructive border-destructive"
                  : "bg-background text-muted-foreground border-border";
              return (
                <div key={s.key} className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-center gap-1.5 min-w-[70px]">
                    <div className={`h-10 w-10 rounded-full border flex items-center justify-center ${ring}`}>
                      {st === "done" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : st === "active" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <s.icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="h-px w-6 bg-border" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">1. Elige un producto</h2>

        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No tienes productos aún"
            description="Crea un producto para poder lanzar una campaña."
            action={{ label: "Crear producto", to: "/products/new" }}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const isSelected = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p);
                    setJob(null);
                  }}
                  className={`text-left rounded-xl border-2 transition-all overflow-hidden bg-card hover:border-primary/50 ${
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
                  }`}
                >
                  <div className="aspect-video bg-muted relative">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.description || "Sin descripción"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              {selected.images?.[0] && (
                <img
                  src={selected.images[0]}
                  alt={selected.name}
                  className="h-20 w-20 rounded-lg object-contain bg-background"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase text-primary font-semibold tracking-wide">
                  Producto seleccionado
                </p>
                <h3 className="font-semibold text-lg truncate">{selected.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selected.description}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleLaunch}
              disabled={isGeneratingBanners}
            >
              {isGeneratingBanners ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando banners…
                </>
              ) : bannersDone ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Banners listos · Volver a generar
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Lanzar campaña (3 banners)
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Se generarán 3 banners (Hook, Beneficio, CTA). Coste: 5 créditos por banner.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Banners gallery */}
      {(banners.length > 0 || job?.status === "running") && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Banners generados</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => {
              const url = banners[i];
              return (
                <div
                  key={i}
                  className="aspect-[4/5] rounded-xl border bg-muted/30 overflow-hidden flex items-center justify-center"
                >
                  {url ? (
                    <img src={url} alt={`Banner ${i + 1}`} className="w-full h-full object-contain" />
                  ) : job?.status === "running" ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>
              );
            })}
          </div>
          {job?.status === "failed" && (
            <p className="text-sm text-destructive">
              Error: {job.error_message ?? "fallo desconocido"}. Puedes reintentar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}