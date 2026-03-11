import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Plus, Send, Users, Loader2 } from "lucide-react";

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

const AdminEmailCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [audience, setAudience] = useState("all");

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
    all: "Todos",
    free: "Plan Free",
    starter: "Plan Starter",
    pro: "Plan Pro",
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Campaña</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Asunto</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: ¡Nuevo feature disponible!"
                />
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
                  rows={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                {c.status === "draft" && (
                  <Button
                    size="sm"
                    onClick={() => handleSend(c.id)}
                    disabled={sending === c.id}
                  >
                    {sending === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    Enviar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEmailCampaigns;
