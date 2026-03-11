import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Settings, Save, Cpu, Sliders } from "lucide-react";

interface ConfigItem {
  key: string;
  value: any;
}

const SuperAdminConfig = () => {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [limitFree, setLimitFree] = useState("1");
  const [limitStarter, setLimitStarter] = useState("10");
  const [limitPro, setLimitPro] = useState("100");
  const [bannerLimitFree, setBannerLimitFree] = useState("2");
  const [bannerLimitStarter, setBannerLimitStarter] = useState("30");
  const [bannerLimitPro, setBannerLimitPro] = useState("150");

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    };
  };

  useEffect(() => {
    const fetchConfig = async () => {
      const headers = await getHeaders();
      const res = await fetch(`${baseUrl}/config`, { headers });
      if (res.ok) {
        const data = await res.json();
        const items: ConfigItem[] = data.config || [];
        setConfig(items);

        const prompt = items.find((c) => c.key === "ai_prompt");
        if (prompt) setAiPrompt(prompt.value?.text || "");

        const limits = items.find((c) => c.key === "plan_limits");
        if (limits) {
          setLimitFree(String(limits.value?.free ?? 1));
          setLimitStarter(String(limits.value?.starter ?? 10));
          setLimitPro(String(limits.value?.pro ?? 100));
        }
        const bLimits = items.find((c) => c.key === "banner_limits");
        if (bLimits) {
          setBannerLimitFree(String(bLimits.value?.free ?? 2));
          setBannerLimitStarter(String(bLimits.value?.starter ?? 30));
          setBannerLimitPro(String(bLimits.value?.pro ?? 150));
        }
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const saveConfig = async (key: string, value: any) => {
    setSaving(true);
    const headers = await getHeaders();
    const res = await fetch(`${baseUrl}/config`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ key, value }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Configuración guardada");
    } else {
      toast.error("Error al guardar");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-2">
          <Settings className="h-7 w-7" /> Configuración del Sistema
        </h1>
        <p className="text-muted-foreground mt-1">Solo accesible para Super Admin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" /> Prompt del Generador IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={8}
            placeholder="System prompt para el generador de landings..."
          />
          <Button onClick={() => saveConfig("ai_prompt", { text: aiPrompt })} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> Guardar prompt
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sliders className="h-5 w-5" /> Límites de Planes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Free</Label>
              <Input type="number" value={limitFree} onChange={(e) => setLimitFree(e.target.value)} />
            </div>
            <div>
              <Label>Starter</Label>
              <Input type="number" value={limitStarter} onChange={(e) => setLimitStarter(e.target.value)} />
            </div>
            <div>
              <Label>Pro</Label>
              <Input type="number" value={limitPro} onChange={(e) => setLimitPro(e.target.value)} />
            </div>
          </div>
          <Button
            onClick={() => saveConfig("plan_limits", {
              free: parseInt(limitFree) || 1,
              starter: parseInt(limitStarter) || 10,
              pro: parseInt(limitPro) || 100,
            })}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" /> Guardar límites
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminConfig;
