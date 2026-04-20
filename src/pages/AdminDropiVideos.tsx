import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Video, Loader2, Upload, Copy, X, Search } from "lucide-react";

interface DropiProductVideos {
  id: string;
  name: string;
  image_main: string | null;
  category: string | null;
  video_url: string | null;
  video_2: string | null;
  video_3: string | null;
}

type VideoSlot = "video_url" | "video_2" | "video_3";
const SLOTS: VideoSlot[] = ["video_url", "video_2", "video_3"];
const STORAGE_BUCKET = "dropi-videos";
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const AdminDropiVideos = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<DropiProductVideos[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null); // `${productId}:${slot}`
  const fileRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<{ productId: string; slot: VideoSlot } | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("dropi_products")
      .select("id, name, image_main, category, video_url, video_2, video_3")
      .order("created_at", { ascending: false });
    setProducts((data as DropiProductVideos[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const cleanupOldVideo = async (url: string | null) => {
    if (!url) return;
    try {
      const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
      const idx = url.indexOf(marker);
      if (idx === -1) return;
      const path = url.substring(idx + marker.length).split("?")[0];
      if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    } catch (err) {
      console.warn("[DROPI] cleanup old video", err);
    }
  };

  const requestUpload = (productId: string, slot: VideoSlot) => {
    targetRef.current = { productId, slot };
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = targetRef.current;
    if (!file || !target) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast.error(t("dropi.invalidVideoType"));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error(t("dropi.videoTooLarge"));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const { productId, slot } = target;
    const product = products.find((p) => p.id === productId);
    const previousUrl = product?.[slot] || null;
    const key = `${productId}:${slot}`;
    setUploadingKey(key);

    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path = `${productId}/${slot}-${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("dropi_products")
        .update({ [slot]: publicUrl })
        .eq("id", productId);
      if (updErr) throw updErr;

      await cleanupOldVideo(previousUrl);
      toast.success(t("dropi.videoUploaded"));
      loadProducts();
    } catch (err) {
      console.error("[DROPI Video Upload]", err);
      toast.error((err as Error).message || t("common.error"));
    } finally {
      setUploadingKey(null);
      targetRef.current = null;
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async (product: DropiProductVideos, slot: VideoSlot) => {
    const url = product[slot];
    if (!url) return;
    const key = `${product.id}:${slot}`;
    setUploadingKey(key);
    try {
      const { error } = await supabase
        .from("dropi_products")
        .update({ [slot]: null })
        .eq("id", product.id);
      if (error) throw error;
      await cleanupOldVideo(url);
      toast.success(t("dropi.videoRemoved"));
      loadProducts();
    } catch (err) {
      toast.error((err as Error).message || t("common.error"));
    } finally {
      setUploadingKey(null);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("dropi.urlCopied"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalVideos = products.reduce(
    (acc, p) => acc + SLOTS.filter((s) => p[s]).length,
    0
  );

  return (
    <div className="page-in p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
          <Video className="h-6 w-6 text-primary" />
          {t("dropi.adminVideosTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dropi.adminVideosDesc")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("dropi.totalProducts")}: <strong>{products.length}</strong> · {t("dropi.totalVideos")}: <strong>{totalVideos}</strong>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Video className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">{t("dropi.noProducts")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                {p.image_main ? (
                  <img src={p.image_main} alt="" className="h-12 w-12 rounded-md object-cover bg-muted" />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{p.name}</p>
                  {p.category && (
                    <span className="text-xs text-muted-foreground uppercase">{p.category}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map((slot, i) => {
                  const url = p[slot];
                  const key = `${p.id}:${slot}`;
                  const isUploading = uploadingKey === key;
                  return (
                    <div key={slot} className="rounded-lg border border-border/60 bg-muted/30 p-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Video {i + 1}
                        </span>
                        {url && (
                          <button
                            onClick={() => handleRemove(p, slot)}
                            disabled={isUploading}
                            className="text-destructive/70 hover:text-destructive disabled:opacity-40"
                            title={t("dropi.removeVideo")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {url ? (
                        <video
                          src={url}
                          className="w-full aspect-[9/16] rounded-md object-cover bg-black"
                          muted
                          playsInline
                          preload="metadata"
                          controls
                        />
                      ) : (
                        <div className="w-full aspect-[9/16] rounded-md bg-muted/60 flex items-center justify-center">
                          <Video className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          disabled={isUploading}
                          onClick={() => requestUpload(p.id, slot)}
                        >
                          {isUploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-3 w-3 mr-1" />
                              {url ? t("dropi.replaceVideo") : t("dropi.uploadVideo")}
                            </>
                          )}
                        </Button>
                        {url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px]"
                            onClick={() => handleCopy(url)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {t("dropi.copyUrl")}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDropiVideos;
