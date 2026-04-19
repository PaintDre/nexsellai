import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Upload, Package, Loader2, Pencil, Check, X, Trash2, Video, Link as LinkIcon, Copy } from "lucide-react";
import * as XLSX from "xlsx";

interface DropiProduct {
  id: string;
  name: string;
  image_main: string | null;
  video_url: string | null;
  category: string | null;
}

const AdminDropiCatalog = () => {
  const { t } = useTranslation();
  const { session } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<DropiProduct[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [videoValue, setVideoValue] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DropiProduct | null>(null);
  const [uploadingVideoFor, setUploadingVideoFor] = useState<string | null>(null);
  const [videoUploadTarget, setVideoUploadTarget] = useState<string | null>(null);

  const STORAGE_BUCKET = "dropi-videos";
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

  const loadProducts = async () => {
    const { data } = await supabase
      .from("dropi_products")
      .select("id, name, image_main, video_url, category")
      .order("created_at", { ascending: false });
    setProducts((data as DropiProduct[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.access_token) return;

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

      console.log("[DROPI Upload] Parsed rows:", rows.length, "First row:", rows[0]);

      // Normalize Dropbox URLs to render inline (raw=1) and force https
      const normalizeUrl = (url: string): string => {
        if (!url) return url;
        let u = url.trim();
        if (!u) return u;
        // Dropbox: convert dl=0/dl=1 to raw=1, and www.dropbox.com works with raw=1
        if (/dropbox\.com/i.test(u)) {
          u = u.replace(/([?&])dl=[01]/i, "$1raw=1");
          if (!/[?&]raw=1/i.test(u)) {
            u += (u.includes("?") ? "&" : "?") + "raw=1";
          }
        }
        return u;
      };

      // Normalize keys (lowercase, trim) for flexible matching
      const pick = (row: Record<string, any>, ...keys: string[]): string => {
        const normalized: Record<string, any> = {};
        for (const k of Object.keys(row)) {
          normalized[k.toLowerCase().trim()] = row[k];
        }
        for (const k of keys) {
          const v = normalized[k.toLowerCase()];
          if (v !== undefined && v !== null && String(v).trim() !== "") {
            return String(v).trim();
          }
        }
        return "";
      };

      const products = rows
        .map((r) => ({
          name: pick(r, "name", "nombre", "product", "producto"),
          image_main: normalizeUrl(pick(r, "image_main", "image_1", "imagen_principal", "imagen_1", "image", "imagen")) || null,
          image_2: normalizeUrl(pick(r, "image_2", "imagen_2", "image2")) || null,
          image_3: normalizeUrl(pick(r, "image_3", "imagen_3", "image3")) || null,
          video_url: normalizeUrl(pick(r, "video_url", "video", "url_video")) || null,
          category: pick(r, "category", "categoria", "categoría") || null,
        }))
        .filter((p) => p.name);

      console.log("[DROPI Upload] Valid products:", products.length);

      if (!products.length) {
        const headers = rows[0] ? Object.keys(rows[0]).join(", ") : "(empty file)";
        toast.error(
          `No se encontraron productos válidos. Columnas detectadas: ${headers}. Se requiere columna "name" o "nombre".`,
          { duration: 8000 }
        );
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/dropi-catalog`;
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ products }),
      });

      const result = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(result?.error || `Upload failed (${resp.status})`);
      }

      toast.success(`${t("dropi.catalogUploaded")} (${result.count || products.length})`);
      loadProducts();
    } catch (err) {
      console.error("[DROPI Upload]", err);
      toast.error((err as Error).message || t("dropi.catalogError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSaveVideo = async (productId: string) => {
    const { error } = await supabase
      .from("dropi_products")
      .update({ video_url: videoValue || null })
      .eq("id", productId);

    if (error) {
      toast.error(t("common.error"));
    } else {
      toast.success(t("common.save"));
      setEditingVideo(null);
      loadProducts();
    }
  };

  const handleSaveName = async (productId: string) => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      toast.error(t("common.error"));
      return;
    }
    const { error } = await supabase
      .from("dropi_products")
      .update({ name: trimmed })
      .eq("id", productId);

    if (error) {
      toast.error(t("common.error"));
    } else {
      toast.success(t("common.save"));
      setEditingName(null);
      loadProducts();
    }
  };

  // Delete previous video file from bucket if it lives in our storage
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

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const productId = videoUploadTarget;
    if (!file || !productId) return;

    if (!file.type.startsWith("video/")) {
      toast.error(t("dropi.invalidVideoType"));
      if (videoFileRef.current) videoFileRef.current.value = "";
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error(t("dropi.videoTooLarge"));
      if (videoFileRef.current) videoFileRef.current.value = "";
      return;
    }

    const product = products.find((p) => p.id === productId);
    setUploadingVideoFor(productId);
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path = `${productId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("dropi_products")
        .update({ video_url: publicUrl })
        .eq("id", productId);
      if (updErr) throw updErr;

      await cleanupOldVideo(product?.video_url || null);

      toast.success(t("dropi.videoUploaded"));
      loadProducts();
    } catch (err) {
      console.error("[DROPI Video Upload]", err);
      toast.error((err as Error).message || t("common.error"));
    } finally {
      setUploadingVideoFor(null);
      setVideoUploadTarget(null);
      if (videoFileRef.current) videoFileRef.current.value = "";
    }
  };

  const handleRemoveVideo = async (product: DropiProduct) => {
    setUploadingVideoFor(product.id);
    try {
      const { error } = await supabase
        .from("dropi_products")
        .update({ video_url: null })
        .eq("id", product.id);
      if (error) throw error;
      await cleanupOldVideo(product.video_url);
      toast.success(t("dropi.videoRemoved"));
      loadProducts();
    } catch (err) {
      toast.error((err as Error).message || t("common.error"));
    } finally {
      setUploadingVideoFor(null);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("dropi.urlCopied"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("dropi_products")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      toast.error(t("common.error"));
    } else {
      toast.success(t("dropi.productDeleted"));
      setDeleteTarget(null);
      loadProducts();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              {t("dropi.adminCatalog")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("dropi.adminCatalogDesc")}
            </p>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleUpload}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {t("dropi.uploadExcel")}
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("dropi.totalProducts")}: <strong>{products.length}</strong>
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t("dropi.image")}</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t("dropi.productName")}</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t("dropi.category")}</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Video</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">
                      {p.image_main ? (
                        <img src={p.image_main} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted" />
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium text-foreground">
                      {editingName === p.id ? (
                        <div className="flex gap-1 items-center">
                          <Input
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveName(p.id);
                              if (e.key === "Escape") setEditingName(null);
                            }}
                            autoFocus
                            className="h-8 text-xs"
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveName(p.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingName(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <span>{p.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            title={t("dropi.editName")}
                            onClick={() => {
                              setEditingName(p.id);
                              setNameValue(p.name);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{p.category || "—"}</td>
                    <td className="px-4 py-2">
                      {editingVideo === p.id ? (
                        <div className="flex gap-1">
                          <Input
                            value={videoValue}
                            onChange={(e) => setVideoValue(e.target.value)}
                            placeholder="URL"
                            className="h-8 text-xs"
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveVideo(p.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingVideo(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {p.video_url ? "✓" : "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Video"
                          onClick={() => {
                            setEditingVideo(p.id);
                            setVideoValue(p.video_url || "");
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title={t("dropi.deleteProduct")}
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("dropi.deleteProduct")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("dropi.confirmDelete")}
                {deleteTarget && <span className="block mt-2 font-medium text-foreground">{deleteTarget.name}</span>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default AdminDropiCatalog;
