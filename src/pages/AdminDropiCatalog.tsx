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
import { Upload, Package, Loader2, Pencil, Check, X, Trash2 } from "lucide-react";
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
  const [products, setProducts] = useState<DropiProduct[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [videoValue, setVideoValue] = useState("");

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
          image_main: pick(r, "image_main", "imagen_principal", "image", "imagen") || null,
          image_2: pick(r, "image_2", "imagen_2", "image2") || null,
          image_3: pick(r, "image_3", "imagen_3", "image3") || null,
          video_url: pick(r, "video_url", "video", "url_video") || null,
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
                    <td className="px-4 py-2 font-medium text-foreground">{p.name}</td>
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
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingVideo(p.id);
                          setVideoValue(p.video_url || "");
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
};

export default AdminDropiCatalog;
