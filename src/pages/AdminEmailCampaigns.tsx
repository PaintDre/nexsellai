import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Plus, Send, Users, Loader2, Eye, FileText } from "lucide-react";
import { emailTemplates, getEmailPreviewHtml, type EmailTemplate } from "@/lib/emailTemplates";
import { useTranslation } from "react-i18next";

interface Campaign {
  id: string;
  subject: string;
  body_html: string;
  audience: string;
  status: string;
  sent_count: number;
  created_at: string;
  sent_at: string | null;
}

const EmailPreview = ({ html }: { html: string }) => {
  const previewHtml = useMemo(() => getEmailPreviewHtml(html), [html]);
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <iframe srcDoc={previewHtml} className="w-full h-[500px] border-0" title="Email preview" sandbox="allow-same-origin" />
    </div>
  );
};

const AdminEmailCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [audience, setAudience] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const { t } = useTranslation();

  const fetchCampaigns = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/campaigns`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "custom") return;
    const tpl = emailTemplates.find((tp) => tp.id === templateId);
    if (tpl) {
      setSubject(tpl.subject);
      setBodyHtml(tpl.body_html);
    }
  };

  const handleCreate = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error(t("adminCampaigns.fillRequired"));
      return;
    }
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/campaigns`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject, body_html: bodyHtml, audience }),
    });
    if (res.ok) {
      toast.success(t("adminCampaigns.created"));
      setSubject(""); setBodyHtml(""); setAudience("all"); setSelectedTemplate("");
      setDialogOpen(false);
      fetchCampaigns();
    } else {
      toast.error(t("adminCampaigns.createError"));
    }
    setCreating(false);
  };

  const handleSend = async (campaignId: string) => {
    setSending(campaignId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/campaigns/${campaignId}/send`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(t("adminCampaigns.sentSuccess", { count: data.sent_count || 0 }));
      fetchCampaigns();
    } else {
      toast.error(t("adminCampaigns.sendError"));
    }
    setSending(null);
  };

  const audienceLabel = (key: string) => t(`adminCampaigns.audienceLabels.${key}`, key);

  const statusBadge = (status: string) => {
    if (status === "sent") return <Badge className="bg-emerald-500/15 text-emerald-600 border-0">{t("adminCampaigns.sent")}</Badge>;
    return <Badge variant="secondary">{t("adminCampaigns.draft")}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-in p-4 md:p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Mail className="h-3.5 w-3.5" /> {t("admin.eyebrow")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">{t("adminCampaigns.title")}</h1>
          <p className="text-muted-foreground text-sm max-w-xl">{t("adminCampaigns.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> {t("adminCampaigns.newCampaign")}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("adminCampaigns.createCampaign")}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="edit" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="edit" className="flex-1 gap-1.5"><FileText className="h-3.5 w-3.5" /> {t("adminCampaigns.editTab")}</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1 gap-1.5"><Eye className="h-3.5 w-3.5" /> {t("adminCampaigns.previewTab")}</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t("adminCampaigns.template")}</label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger><SelectValue placeholder={t("adminCampaigns.templatePlaceholder")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">{t("adminCampaigns.custom")}</SelectItem>
                      {emailTemplates.map((tp) => (
                        <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t("adminCampaigns.subject")}</label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("adminCampaigns.subjectPlaceholder")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t("adminCampaigns.audience")}</label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("adminCampaigns.allUsers")}</SelectItem>
                      <SelectItem value="free">{t("adminCampaigns.freeOnly")}</SelectItem>
                      <SelectItem value="starter">{t("adminCampaigns.starterOnly")}</SelectItem>
                      <SelectItem value="pro">{t("adminCampaigns.proOnly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t("adminCampaigns.contentHTML")}</label>
                  <Textarea
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    placeholder={t("adminCampaigns.contentPlaceholder")}
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                {bodyHtml.trim() ? (
                  <EmailPreview html={bodyHtml} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Eye className="h-10 w-10 mb-3 opacity-40" />
                    <p>{t("adminCampaigns.writeContent")}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {t("common.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!previewCampaign} onOpenChange={(open) => !open && setPreviewCampaign(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("adminCampaigns.preview", { subject: previewCampaign?.subject })}</DialogTitle>
          </DialogHeader>
          {previewCampaign && <EmailPreview html={previewCampaign.body_html} />}
        </DialogContent>
      </Dialog>

      {campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-foreground">{t("adminCampaigns.noCampaigns")}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">{t("adminCampaigns.noCampaignsHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{c.subject}</p>
                    {statusBadge(c.status)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {audienceLabel(c.audience)}</span>
                    {c.sent_count > 0 && <span>{t("adminCampaigns.sentCount", { count: c.sent_count })}</span>}
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewCampaign(c)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {c.status === "draft" && (
                    <Button size="sm" onClick={() => handleSend(c.id)} disabled={sending === c.id}>
                      {sending === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                      {t("adminCampaigns.send")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEmailCampaigns;
