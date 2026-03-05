import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Loader2, FileArchive, FileCode, Maximize2, ImagePlus, Sparkles, Pencil, Save, X, Copy } from "lucide-react";
import { exportLandingAsHTML, exportLandingAsZip } from "@/lib/exportLanding";
import LandingRenderer from "@/components/landing/LandingRenderer";
import { themes, type LandingTheme } from "@/components/landing/themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplateGallery } from "@/components/banner/TemplateGallery";
import { bannerSizes } from "@/components/banner/templates";
import VersionHistory from "@/components/landing/VersionHistory";

type Landing = Tables<"landings">;
type Product = Tables<"products">;

interface BlockWithImage {
  type: string;
  title?: string;
  content?: any;
  image_url?: string;
}

const LandingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [landing, setLanding] = useState<Landing | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [theme, setTheme] = useState<LandingTheme>("clean");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [allImageUrls, setAllImageUrls] = useState<string[]>([]);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editedBlocks, setEditedBlocks] = useState<BlockWithImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Section image generation state
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSectionTitle, setSelectedSectionTitle] = useState<string>("");
  const [templateId, setTemplateId] = useState("hero-producto");
  const [outputSize, setOutputSize] = useState("1200x628");
  const [generatingImage, setGeneratingImage] = useState(false);

  const isPaidPlan = profile?.plan === "starter" || profile?.plan === "pro";

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      const { data: l, error: le } = await supabase
        .from("landings").select("*").eq("id", id).eq("user_id", user.id).single();
      if (le || !l) { setError("No se encontró la landing."); setLoading(false); return; }
      setLanding(l);
      setTheme(((l as any).theme || "clean") as LandingTheme);
      const { data: p } = await supabase
        .from("products").select("*").eq("id", l.product_id).single();
      setProduct(p);

      if (p && p.images && p.images.length > 0) {
        const urls: string[] = [];
        for (const imgPath of p.images) {
          if (imgPath.startsWith("http")) {
            urls.push(imgPath);
          } else {
            const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(imgPath);
            if (urlData?.publicUrl) urls.push(urlData.publicUrl);
          }
        }
        setAllImageUrls(urls);
        if (urls.length > 0) setProductImage(urls[0]);
      }

      setLoading(false);
    };
    load();
  }, [id, user]);

  const blocks = (editMode ? editedBlocks : (landing?.blocks as unknown as BlockWithImage[])) || [];

  const handleEnterEditMode = () => {
    setEditedBlocks(JSON.parse(JSON.stringify(landing?.blocks || [])));
    setEditMode(true);
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedBlocks([]);
    setHasChanges(false);
  };

  const handleBlocksChange = (newBlocks: any[]) => {
    setEditedBlocks(newBlocks);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!landing || !user) return;
    setSaving(true);
    try {
      // Save version snapshot of previous blocks before updating
      const prevBlocks = landing.blocks;
      const { data: versionCount } = await supabase
        .from("landing_versions")
        .select("id", { count: "exact", head: true })
        .eq("landing_id", landing.id);

      const nextVersion = (versionCount as any)?.length ? (versionCount as any).length + 1 : 1;

      // Count existing versions to determine version_number
      const { count } = await supabase
        .from("landing_versions")
        .select("*", { count: "exact", head: true })
        .eq("landing_id", landing.id);

      await supabase.from("landing_versions").insert({
        landing_id: landing.id,
        user_id: user.id,
        blocks: prevBlocks,
        theme: (landing as any).theme || "clean",
        version_number: (count || 0) + 1,
      } as any);

      // Clean up old versions (keep max 20)
      if ((count || 0) >= 20) {
        const { data: oldest } = await supabase
          .from("landing_versions")
          .select("id")
          .eq("landing_id", landing.id)
          .order("created_at", { ascending: true })
          .limit(1);
        if (oldest && oldest.length > 0) {
          await supabase.from("landing_versions").delete().eq("id", oldest[0].id);
        }
      }

      // Now update the landing
      const { error: updateError } = await supabase
        .from("landings")
        .update({ blocks: editedBlocks as any, updated_at: new Date().toISOString() })
        .eq("id", landing.id)
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      setLanding({ ...landing, blocks: editedBlocks as any });
      setEditMode(false);
      setHasChanges(false);
      toast({ title: "¡Cambios guardados!" });
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!landing || !user) return;
    try {
      const { data, error: insertError } = await supabase
        .from("landings")
        .insert({
          user_id: user.id,
          product_id: landing.product_id,
          name: `${landing.name} (copia)`,
          blocks: landing.blocks,
          mode: landing.mode,
          intensity: landing.intensity,
          theme: (landing as any).theme || "clean",
          has_offer: landing.has_offer,
          guarantee: landing.guarantee,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      toast({ title: "Landing duplicada" });
      navigate(`/landings/${data.id}`);
    } catch (err: any) {
      toast({ title: "Error al duplicar", description: err.message, variant: "destructive" });
    }
  };

  const handleRestoreVersion = async (blocks: any[], versionTheme: string) => {
    if (!landing || !user) return;
    try {
      // Save current state as a version before restoring
      const { count } = await supabase
        .from("landing_versions")
        .select("*", { count: "exact", head: true })
        .eq("landing_id", landing.id);

      await supabase.from("landing_versions").insert({
        landing_id: landing.id,
        user_id: user.id,
        blocks: landing.blocks,
        theme: (landing as any).theme || "clean",
        version_number: (count || 0) + 1,
        label: "Pre-restauración",
      } as any);

      // Update landing with restored version
      const { error: updateError } = await supabase
        .from("landings")
        .update({ blocks: blocks as any, theme: versionTheme, updated_at: new Date().toISOString() })
        .eq("id", landing.id)
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      setLanding({ ...landing, blocks: blocks as any, theme: versionTheme as any });
      setTheme(versionTheme as LandingTheme);
      toast({ title: "Versión restaurada" });
    } catch (err: any) {
      toast({ title: "Error al restaurar", description: err.message, variant: "destructive" });
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = async () => {
    if (!landing) return;
    setExporting(true);
    try {
      const blob = exportLandingAsHTML(
        landing.blocks as any[], product, landing.name, theme, productImage
      );
      downloadBlob(blob, `${landing.name.replace(/\s+/g, "-").toLowerCase()}.html`);
      toast({ title: "HTML exportado correctamente" });
    } catch {
      toast({ title: "Error al exportar", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportZip = async () => {
    if (!landing) return;
    setExporting(true);
    try {
      const blob = await exportLandingAsZip(
        landing.blocks as any[], product, landing.name, theme, allImageUrls
      );
      downloadBlob(blob, `${landing.name.replace(/\s+/g, "-").toLowerCase()}.zip`);
      toast({ title: "ZIP exportado con imágenes" });
    } catch {
      toast({ title: "Error al exportar ZIP", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const openImageGenerator = (sectionType: string, sectionTitle: string) => {
    setSelectedSection(sectionType);
    setSelectedSectionTitle(sectionTitle);
    setShowImageDialog(true);
  };

  const handleGenerateSectionImage = async () => {
    if (!landing || !product || !selectedSection) return;
    setGeneratingImage(true);
    try {
      const targetBlock = blocks.find(b => b.type === selectedSection);
      const blockContent = targetBlock?.content;

      const { data, error } = await supabase.functions.invoke("generate-banner", {
        body: {
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description,
            target_audience: product.target_audience,
            images: allImageUrls,
          },
          templateId,
          outputSize,
          sectionType: selectedSection,
          sectionTitle: selectedSectionTitle,
          landingId: landing.id,
          blockContent,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { data: updatedLanding } = await supabase
        .from("landings").select("*").eq("id", landing.id).single();
      if (updatedLanding) setLanding(updatedLanding);

      toast({ title: "¡Imagen generada!", description: `Imagen agregada a la sección "${selectedSectionTitle}"` });
      setShowImageDialog(false);
    } catch (err: any) {
      toast({ title: "Error al generar imagen", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !landing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || "Landing no encontrada"}</p>
        <Button variant="outline" asChild>
          <Link to="/landings"><ArrowLeft className="h-4 w-4 mr-2" /> Volver a mis landings</Link>
        </Button>
      </div>
    );
  }

  const imageableSections = blocks.filter(b => 
    ["hero", "benefits", "offer", "features", "testimonials", "cta"].includes(b.type)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-muted/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-12 px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/landings"><ArrowLeft className="h-4 w-4 mr-2" /> Mis landings</Link>
          </Button>
          <div className="flex items-center gap-2">
            {/* Edit mode controls */}
            {editMode ? (
              <>
                <Badge variant="default" className="text-xs bg-primary/90">
                  <Pencil className="h-3 w-3 mr-1" /> Modo edición
                </Badge>
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Guardar
                </Button>
              </>
            ) : (
              <>
                <Select value={theme} onValueChange={(v) => setTheme(v as LandingTheme)}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(themes).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="text-xs hidden sm:inline-flex">{landing.name}</Badge>

                <Button variant="outline" size="sm" onClick={handleEnterEditMode}>
                  <Pencil className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
                
                {isPaidPlan && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ImagePlus className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Imágenes IA</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {imageableSections.map((block) => (
                        <DropdownMenuItem
                          key={block.type}
                          onClick={() => openImageGenerator(block.type, block.title || block.type)}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {block.title || block.type}
                          {block.image_url && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">✓</Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button variant="outline" size="sm" asChild>
                  <Link to={`/landings/${landing.id}/preview`}>
                    <Maximize2 className="h-4 w-4 mr-1" /> Vista completa
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={exporting}>
                      {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportHTML}>
                      <FileCode className="h-4 w-4 mr-2" />
                      Solo HTML
                      <span className="text-xs text-muted-foreground ml-2">(imágenes URL)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportZip}>
                      <FileArchive className="h-4 w-4 mr-2" />
                      ZIP con imágenes
                      <span className="text-xs text-muted-foreground ml-2">(HTML + archivos)</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>

      <LandingRenderer
        blocks={blocks}
        product={product ? { name: product.name, price: product.price } : null}
        imagePreview={productImage}
        theme={theme}
        editable={editMode}
        onBlocksChange={handleBlocksChange}
      />

      {/* Image Generation Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generar imagen para: {selectedSectionTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-3">Elige una plantilla visual</p>
              <TemplateGallery selected={templateId} onSelect={setTemplateId} />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Tamaño de salida</p>
              <Select value={outputSize} onValueChange={setOutputSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bannerSizes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label} ({s.width}×{s.height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateSectionImage}
              disabled={generatingImage}
              className="w-full"
              size="lg"
            >
              {generatingImage ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando imagen...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generar Imagen con IA</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingView;
