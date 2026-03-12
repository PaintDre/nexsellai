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
      <iframe
        srcDoc={previewHtml}
        className="w-full h-[500px] border-0"
        title="Email preview"
        sandbox="allow-same-origin"
      />
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
    if (templateId === "custom") {
      return;
    }
    const tpl = emailTemplates.find((t) => t.id === templateId);
    if (tpl) {
      setSubject(tpl.subject);
      setBodyHtml(tpl.body_html);
    }
  };

  const handleCreate = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error("Completa asunto y contenido");
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
      toast.success("Campaña creada");
      setSubject("");
      setBodyHtml("");
      setAudience("all");
      setSelectedTemplate("");
      setDialogOpen(false);
      fetchCampaigns();
    } else {
      toast.error("Error al crear campaña");
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
      toast.success(`Campaña enviada a ${data.sent_count || 0} usuarios`);
      fetchCampaigns();
    } else {
      toast.error("Error al enviar campaña");
    }
    setSending(null);
  };

  const audienceLabel: Record<string, string> = {
    all: "Todos", free: "Plan Free", starter: "Plan Starter", pro: "Plan Pro",
  };

  const statusBadge = (status: string) => {
    if (status === "sent") return <Badge className="bg-emerald-500/15 text-emerald-600 border-0">Enviada</Badge>;
    return <Badge variant="secondary">Borrador</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Email Marketing</h1>
          <p className="text-muted-foreground text-sm mt-1">Crea y envía campañas de email a tus usuarios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nueva Campaña</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Campaña</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="edit" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="edit" className="flex-1 gap-1.5"><FileText className="h-3.5 w-3.5" /> Editar</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1 gap-1.5"><Eye className="h-3.5 w-3.5" /> Vista previa</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Plantilla</label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger><SelectValue placeholder="Selecciona una plantilla o escribe tu propio email" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">✏️ Personalizado</SelectItem>
                      {emailTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Asunto</label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej: ¡Nuevo feature disponible!" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Audiencia</label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los usuarios</SelectItem>
                      <SelectItem value="free">Solo Plan Free</SelectItem>
                      <SelectItem value="starter">Solo Plan Starter</SelectItem>
                      <SelectItem value="pro">Solo Plan Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Contenido (HTML)</label>
                  <Textarea
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    placeholder="<h1>Hola {{nombre}}</h1><p>Contenido del email...</p>"
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
                    <p>Escribe contenido HTML para ver la vista previa</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview dialog for existing campaigns */}
      <Dialog open={!!previewCampaign} onOpenChange={(open) => !open && setPreviewCampaign(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista previa: {previewCampaign?.subject}</DialogTitle>
          </DialogHeader>
          {previewCampaign && <EmailPreview html={previewCampaign.body_html} />}
        </DialogContent>
      </Dialog>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No hay campañas aún. Crea tu primera campaña de email.</p>
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
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {audienceLabel[c.audience] || c.audience}</span>
                    {c.sent_count > 0 && <span>{c.sent_count} enviados</span>}
                    <span>{new Date(c.created_at).toLocaleDateString("es-CL")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewCampaign(c)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {c.status === "draft" && (
                    <Button size="sm" onClick={() => handleSend(c.id)} disabled={sending === c.id}>
                      {sending === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                      Enviar
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
