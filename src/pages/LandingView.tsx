import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Download, Loader2, FileArchive, FileCode, Maximize2, ImagePlus, Sparkles, Pencil, Save, X, Copy, Trash2, Globe, GlobeLock, Share2, ExternalLink, Eye, TrendingUp, MoreVertical, Store } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { exportShopifyZip } from "@/lib/exportShopify";
import LandingRenderer from "@/components/landing/LandingRenderer";
import { themes, type LandingTheme } from "@/components/landing/themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import ExportPreviewDialog from "@/components/landing/ExportPreviewDialog";
import ResizablePreview from "@/components/landing/ResizablePreview";
import DesignCriticPanel from "@/components/landing/DesignCriticPanel";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  
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
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [viewsData, setViewsData] = useState<{ total: number; last7: number; daily: { date: string; views: number }[] }>({ total: 0, last7: 0, daily: [] });
  const isPaidPlan = profile?.plan === "starter" || profile?.plan === "pro";

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) + "-" + Date.now().toString(36);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      const { data: l, error: le } = await supabase
        .from("landings").select("*").eq("id", id).eq("user_id", user.id).single();
      if (le || !l) { setError(t("landingView.notFound")); setLoading(false); return; }
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

  // Load analytics
  useEffect(() => {
    if (!landing) return;
    const loadViews = async () => {
      const { data, count } = await (supabase.from("landing_views" as any).select("*", { count: "exact" }).eq("landing_id", landing.id) as any);
      const rows = data || [];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recent = rows.filter((r: any) => new Date(r.viewed_at) >= sevenDaysAgo);

      const dailyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dailyMap[d.toISOString().slice(0, 10)] = 0;
      }
      recent.forEach((r: any) => {
        const day = new Date(r.viewed_at).toISOString().slice(0, 10);
        if (dailyMap[day] !== undefined) dailyMap[day]++;
      });

      setViewsData({
        total: count || rows.length,
        last7: recent.length,
        daily: Object.entries(dailyMap).map(([date, views]) => ({ date, views })),
      });
    };
    loadViews();
  }, [landing?.id]);

  const handleTogglePublish = async () => {
    if (!landing || !user) return;
    setPublishing(true);
    try {
      const isPublished = (landing as any).published;
      if (isPublished) {
        await (supabase.from("landings").update({ published: false, published_at: null } as any).eq("id", landing.id).eq("user_id", user.id) as any);
        setLanding({ ...landing, published: false, published_at: null } as any);
        toast.success(t("landingView.unpublished"));
      } else {
        const slug = (landing as any).slug || slugify(landing.name);
        await (supabase.from("landings").update({ published: true, slug, published_at: new Date().toISOString() } as any).eq("id", landing.id).eq("user_id", user.id) as any);
        setLanding({ ...landing, published: true, slug, published_at: new Date().toISOString() } as any);
        toast.success(t("landingView.published"));
      }
    } catch (err: any) {
      toast.error(t("common.error"), { description: err.message });
    } finally {
      setPublishing(false);
    }
  };

  const publicUrl = (landing as any)?.slug
    ? `${window.location.origin}/p/${(landing as any).slug}`
    : null;

  const handleCopyPublicUrl = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast.success(t("landingView.urlCopied"));
    }
  };

  const handleShare = (platform: string) => {
    if (!publicUrl) return;
    const text = encodeURIComponent(landing?.name || "Landing Page");
    const url = encodeURIComponent(publicUrl);
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer");
  };

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
      const prevBlocks = landing.blocks;
      const { data: versionCount } = await supabase
        .from("landing_versions")
        .select("id", { count: "exact", head: true })
        .eq("landing_id", landing.id);

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

      const { error: updateError } = await supabase
        .from("landings")
        .update({ blocks: editedBlocks as any, updated_at: new Date().toISOString() })
        .eq("id", landing.id)
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      setLanding({ ...landing, blocks: editedBlocks as any });
      setEditMode(false);
      setHasChanges(false);
      toast.success(t("landingView.changesSaved"));
    } catch (err: any) {
      toast.error(t("landingView.saveError"), { description: err.message });
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
          name: `${landing.name} (${t("landingView.copy")})`,
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
      toast.success(t("landingView.duplicated"));
      navigate(`/landings/${data.id}`);
    } catch (err: any) {
      toast.error(t("landingView.duplicateError"), { description: err.message });
    }
  };

  const handleRestoreVersion = async (blocks: any[], versionTheme: string) => {
    if (!landing || !user) return;
    try {
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
        label: t("landingView.preRestore"),
      } as any);

      const { error: updateError } = await supabase
        .from("landings")
        .update({ blocks: blocks as any, theme: versionTheme, updated_at: new Date().toISOString() })
        .eq("id", landing.id)
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      setLanding({ ...landing, blocks: blocks as any, theme: versionTheme as any });
      setTheme(versionTheme as LandingTheme);
      toast.success(t("landingView.versionRestored"));
    } catch (err: any) {
      toast.error(t("landingView.restoreError"), { description: err.message });
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

  const handleExportShopify = async () => {
    if (!landing) return;
    setExporting(true);
    try {
      const blob = await exportShopifyZip(
        landing.blocks as any[], product, theme, productImage, allImageUrls
      );
      downloadBlob(blob, `${landing.name.replace(/\s+/g, "-").toLowerCase()}-shopify.zip`);
      toast.success(t("exportDialog.liquidDownloaded"));
    } catch {
      toast.error(t("common.error"));
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
    const toastId = toast.loading(t("ai.generatingImage"), { description: t("ai.queuedDesc") });
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

      toast.success(t("ai.readyTitle"), { id: toastId, description: t("landingView.imageAddedTo", { section: selectedSectionTitle }) });
      setShowImageDialog(false);
    } catch (err: any) {
      toast.error(t("ai.errorTitle"), { id: toastId, description: err.message });
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
        <p className="text-muted-foreground">{error || t("landingView.landingNotFound")}</p>
        <Button variant="outline" asChild>
          <Link to="/landings"><ArrowLeft className="h-4 w-4 mr-2" /> {t("landingView.backToLandings")}</Link>
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
            <Link to="/landings"><ArrowLeft className="h-4 w-4 mr-2" /> {t("landingView.myLandings")}</Link>
          </Button>
          <div className="flex items-center gap-2">
            {/* Edit mode controls */}
            {editMode ? (
              <>
                <Badge variant="default" className="text-xs bg-primary/90">
                  <Pencil className="h-3 w-3 mr-1" /> {t("landingView.editMode")}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" /> {t("common.cancel")}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  {t("common.save")}
                </Button>
              </>
            ) : (
              <>
                {/* Theme selector */}
                <Select value={theme} onValueChange={async (v) => {
                  const newTheme = v as LandingTheme;
                  setTheme(newTheme);
                  if (landing) {
                    await supabase.from("landings").update({ theme: v }).eq("id", landing.id);
                    setLanding({ ...landing, theme: v } as any);
                  }
                }}>
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(themes).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: cfg.ctaBg }} />
                          {cfg.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="h-5 w-px bg-border hidden sm:block" />

                {/* Primary: Edit */}
                <Button variant="outline" size="sm" onClick={handleEnterEditMode}>
                  <Pencil className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t("common.edit")}</span>
                </Button>

                {/* Primary: Export */}
                <Button variant="outline" size="sm" onClick={() => setShowExportPreview(true)} disabled={exporting}>
                  <Store className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t("common.export")}</span>
                </Button>

                {/* Primary: Publish */}
                <Button
                  variant={(landing as any).published ? "default" : "outline"}
                  size="sm"
                  onClick={handleTogglePublish}
                  disabled={publishing}
                >
                  {publishing ? <Loader2 className="h-4 w-4 sm:mr-1 animate-spin" /> :
                    (landing as any).published ? <Globe className="h-4 w-4 sm:mr-1" /> : <GlobeLock className="h-4 w-4 sm:mr-1" />}
                  <span className="hidden sm:inline">{(landing as any).published ? t("landingView.publishedLabel") : t("landingView.publish")}</span>
                </Button>

                <div className="h-5 w-px bg-border hidden sm:block" />

                {/* Secondary actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem asChild>
                      <Link to={`/landings/${landing.id}/preview`} className="flex items-center">
                        <Maximize2 className="h-4 w-4 mr-2" /> {t("landingView.fullView")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicate}>
                      <Copy className="h-4 w-4 mr-2" /> {t("common.duplicate")}
                    </DropdownMenuItem>

                    {isPaidPlan && imageableSections.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        {imageableSections.map((block) => (
                          <DropdownMenuItem
                            key={block.type}
                            onClick={() => openImageGenerator(block.type, block.title || block.type)}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {t("landingView.aiImages")}: {block.title || block.type}
                            {block.image_url && <Badge variant="secondary" className="ml-auto text-[10px]">✓</Badge>}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleExportShopify}>
                      <Download className="h-4 w-4 mr-2" /> {t("exportDialog.downloadLiquid")}
                    </DropdownMenuItem>

                    {(landing as any).published && publicUrl && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleCopyPublicUrl}>
                          <Copy className="h-4 w-4 mr-2" /> {t("landingView.copyUrl")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(publicUrl, "_blank")}>
                          <ExternalLink className="h-4 w-4 mr-2" /> {t("landingView.openNewTab")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
                          <Share2 className="h-4 w-4 mr-2" /> WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare("facebook")}>
                          <Share2 className="h-4 w-4 mr-2" /> Facebook
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={async () => {
                        if (!confirm(t("landingView.deleteDesc", { name: landing.name }))) return;
                        try {
                          const { error } = await supabase.from("landings").delete().eq("id", landing.id).eq("user_id", user!.id);
                          if (error) throw error;
                          toast.success(t("landingView.deleted"));
                          navigate("/landings");
                        } catch (err: any) {
                          toast.error(t("landingView.deleteError"), { description: err.message });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <VersionHistory
                  landingId={landing.id}
                  userId={user!.id}
                  onRestore={handleRestoreVersion}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-3">
        <DesignCriticPanel
          blocks={blocks}
          theme={theme}
          product={product ? { name: product.name, price: product.price, category: product.category } : null}
        />
      </div>

      <ResizablePreview editable={editMode}>
        <LandingRenderer
          blocks={blocks}
          product={product ? { name: product.name, price: product.price, category: product.category } : null}
          imagePreview={productImage}
          theme={theme}
          editable={editMode}
          onBlocksChange={handleBlocksChange}
          hasOffer={!!(landing as any).has_offer}
          countryCode={profile?.country_code || null}
        />
      </ResizablePreview>

      {/* Analytics section */}
      {(landing as any).published && viewsData.total > 0 && (
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 items-end">
                <div>
                  <p className="text-2xl font-bold text-foreground">{viewsData.total}</p>
                  <p className="text-xs text-muted-foreground">{t("landingView.totalViews")}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{viewsData.last7}</p>
                  <p className="text-xs text-muted-foreground">{t("landingView.last7Days")}</p>
                </div>
                <div className="flex-1 flex items-end gap-1 h-12">
                  {viewsData.daily.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/80 rounded-sm min-h-[2px]"
                        style={{ height: `${Math.max(2, (d.views / Math.max(...viewsData.daily.map(x => x.views), 1)) * 48)}px` }}
                      />
                      <span className="text-[9px] text-muted-foreground">{d.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Preview Dialog */}
      <ExportPreviewDialog
        open={showExportPreview}
        onOpenChange={setShowExportPreview}
        blocks={blocks}
        product={product ? { name: product.name, price: product.price } : null}
        landingName={landing.name}
        theme={theme}
        productImage={productImage}
        allImageUrls={allImageUrls}
      />

      {/* Image Generation Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {t("landingView.generateImageFor", { section: selectedSectionTitle })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-3">{t("landingView.chooseTemplate")}</p>
              <TemplateGallery selectedId={templateId} onSelect={(id) => setTemplateId(id)} />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">{t("landingView.outputSize")}</p>
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
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("landingView.generatingImage")}</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> {t("landingView.generateImageAI")}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingView;
