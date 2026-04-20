import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Zap, Plus, Loader2, Eye, FileText, Clock, Trash2 } from "lucide-react";
import { emailTemplates, getEmailPreviewHtml } from "@/lib/emailTemplates";
import { useTranslation } from "react-i18next";

interface Automation {
  id: string;
  name: string;
  trigger_event: string;
  delay_hours: number;
  subject: string;
  body_html: string;
  enabled: boolean;
  created_at: string;
}

const EmailPreview = ({ html }: { html: string }) => {
  const previewHtml = useMemo(() => getEmailPreviewHtml(html), [html]);
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <iframe srcDoc={previewHtml} className="w-full h-[400px] border-0" title="Email preview" sandbox="allow-same-origin" />
    </div>
  );
};

const AdminEmailAutomations = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewAutomation, setPreviewAutomation] = useState<Automation | null>(null);
  const [name, setName] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("signup");
  const [delayHours, setDelayHours] = useState(24);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const { t } = useTranslation();

  const triggerLabels: Record<string, string> = {
    signup: t("adminAutomations.triggers.signup"),
    no_landing_3d: t("adminAutomations.triggers.no_landing_3d"),
    no_payment_7d: t("adminAutomations.triggers.no_payment_7d"),
    inactive_14d: t("adminAutomations.triggers.inactive_14d"),
  };

  const apiCall = async (path: string, options?: RequestInit) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api${path}`;
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  };

  const fetchAutomations = async () => {
    const res = await apiCall("/automations");
    if (res?.ok) {
      const data = await res.json();
      setAutomations(data.automations || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAutomations(); }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "custom") return;
    const tpl = emailTemplates.find((tp) => tp.id === templateId);
    if (tpl) {
      setSubject(tpl.subject);
      setBodyHtml(tpl.body_html);
    }
  };

  const resetForm = () => {
    setName(""); setTriggerEvent("signup"); setDelayHours(24);
    setSubject(""); setBodyHtml(""); setSelectedTemplate("");
  };

  const handleCreate = async () => {
    if (!name.trim() || !subject.trim() || !bodyHtml.trim()) {
      toast.error(t("adminAutomations.fillRequired"));
      return;
    }
    setSaving(true);
    const res = await apiCall("/automations", {
      method: "POST",
      body: JSON.stringify({ name, trigger_event: triggerEvent, delay_hours: delayHours, subject, body_html: bodyHtml }),
    });
    if (res?.ok) {
      toast.success(t("adminAutomations.created"));
      resetForm();
      setDialogOpen(false);
      fetchAutomations();
    } else {
      toast.error(t("adminAutomations.createError"));
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const res = await apiCall(`/automations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
    if (res?.ok) {
      setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, enabled } : a));
      toast.success(enabled ? t("adminAutomations.activated") : t("adminAutomations.deactivated"));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await apiCall(`/automations/${id}`, { method: "DELETE" });
    if (res?.ok) {
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      toast.success(t("adminAutomations.deleted"));
    }
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
            <Zap className="h-3.5 w-3.5" /> {t("admin.eyebrow")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">{t("adminAutomations.title")}</h1>
          <p className="text-muted-foreground text-sm max-w-xl">{t("adminAutomations.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> {t("adminAutomations.newAutomation")}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("adminAutomations.createAutomation")}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="edit" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="edit" className="flex-1 gap-1.5"><FileText className="h-3.5 w-3.5" /> {t("adminAutomations.configureTab")}</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1 gap-1.5"><Eye className="h-3.5 w-3.5" /> {t("adminAutomations.previewTab")}</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t("adminAutomations.name")}</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("adminAutomations.namePlaceholder")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t("adminAutomations.triggerEvent")}</label>
                    <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(triggerLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t("adminAutomations.delayHours")}</label>
                    <Input type="number" min={0} value={delayHours} onChange={(e) => setDelayHours(Number(e.target.value))} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t("adminAutomations.baseTemplate")}</label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger><SelectValue placeholder={t("adminAutomations.templatePlaceholder")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">{t("adminAutomations.custom")}</SelectItem>
                      {emailTemplates.map((tp) => (
                        <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t("adminAutomations.subject")}</label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("adminAutomations.subjectPlaceholder")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t("adminAutomations.contentHTML")}</label>
                  <Textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={8} className="font-mono text-xs" placeholder={t("adminAutomations.contentPlaceholder")} />
                </div>
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                {bodyHtml.trim() ? <EmailPreview html={bodyHtml} /> : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Eye className="h-10 w-10 mb-3 opacity-40" />
                    <p>{t("adminAutomations.writeContent")}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {t("common.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!previewAutomation} onOpenChange={(open) => !open && setPreviewAutomation(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("adminAutomations.preview", { name: previewAutomation?.name })}</DialogTitle>
          </DialogHeader>
          {previewAutomation && <EmailPreview html={previewAutomation.body_html} />}
        </DialogContent>
      </Dialog>

      {automations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-foreground">{t("adminAutomations.noAutomations")}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">{t("adminAutomations.noAutomationsHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{a.name}</p>
                    <Badge variant={a.enabled ? "default" : "secondary"}>
                      {a.enabled ? t("adminAutomations.active") : t("adminAutomations.inactive")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {triggerLabels[a.trigger_event] || a.trigger_event}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t("adminAutomations.delayLabel", { hours: a.delay_hours })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewAutomation(a)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Switch checked={a.enabled} onCheckedChange={(checked) => handleToggle(a.id, checked)} />
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEmailAutomations;
