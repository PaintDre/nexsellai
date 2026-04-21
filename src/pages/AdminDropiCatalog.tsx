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
import { Upload, Package, Loader2, Pencil, Check, X, Trash2, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface DropiProduct {
  id: string;
  name: string;
  image_main: string | null;
  category: string | null;
}

const AdminDropiCatalog = () => {
  const { t } = useTranslation();
  const { session } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<DropiProduct[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DropiProduct | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("dropi_products")
      .select("id, name, image_main, category")
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
        if (/dropbox\.com/i.test(u)) {
          u = u.replace(/([?&])dl=[01]/i, "$1raw=1");
          if (!/[?&]raw=1/i.test(u)) {
            u += (u.includes("?") ? "&" : "?") + "raw=1";
          }
        }
        return u;
      };

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("dropi_products")
        .select("name, category, image_main, image_2, image_3, video_url, video_2, video_3")
        .order("name", { ascending: true });
      if (error) throw error;
      const rows = (data || []).map((p) => ({
        name: (p.name ?? "").toString().trim(),
        category: (p.category ?? "").toString().trim(),
        image_main: (p.image_main ?? "").toString().trim(),
        image_2: (p.image_2 ?? "").toString().trim(),
        image_3: (p.image_3 ?? "").toString().trim(),
        video_url: (p.video_url ?? "").toString().trim(),
        video_2: (p.video_2 ?? "").toString().trim(),
        video_3: (p.video_3 ?? "").toString().trim(),
      }));
      const header = [
        "name",
        "category",
        "image_main",
        "image_2",
        "image_3",
        "video_url",
        "video_2",
        "video_3",
      ];
      const ws = XLSX.utils.json_to_sheet(rows, { header });
      // Column widths for readability
      ws["!cols"] = [
        { wch: 40 }, // name
        { wch: 18 }, // category
        { wch: 60 }, // image_main
        { wch: 60 }, // image_2
        { wch: 60 }, // image_3
        { wch: 60 }, // video_url
        { wch: 60 }, // video_2
        { wch: 60 }, // video_3
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dropi Products");
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `dropi-products-${date}.xlsx`);
      toast.success(`Excel exportado (${rows.length})`);
    } catch (err) {
      console.error("[DROPI Export]", err);
      toast.error((err as Error).message || t("common.error"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-in p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Package className="h-3.5 w-3.5" /> {t("admin.eyebrow")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            {t("dropi.adminCatalog")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            {t("dropi.adminCatalogDesc")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting || loading}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Descargar Excel
          </Button>
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
                    <div className="flex items-center gap-1 justify-end">
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
