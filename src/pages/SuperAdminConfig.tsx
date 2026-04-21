import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, Cpu, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConfigItem {
  key: string;
  value: any;
}

const SuperAdminConfig = () => {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  // Credits system
  const [creditCosts, setCreditCosts] = useState<Record<string, number>>({});
  const [allowFree, setAllowFree] = useState("30");
  const [allowStarter, setAllowStarter] = useState("300");
  const [allowPro, setAllowPro] = useState("1500");
  const { t } = useTranslation();

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
        const costs = items.find((c) => c.key === "credit_costs");
        if (costs?.value) setCreditCosts(costs.value as Record<string, number>);
        const allow = items.find((c) => c.key === "credit_allowances");
        if (allow?.value) {
          setAllowFree(String(allow.value?.free ?? 30));
          setAllowStarter(String(allow.value?.starter ?? 300));
          setAllowPro(String(allow.value?.pro ?? 1500));
        }
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const saveConfig = async (key: string, value: any) => {
    setSaving(key);
    const headers = await getHeaders();
    const res = await fetch(`${baseUrl}/config`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ key, value }),
    });
    setSaving(null);
    if (res.ok) {
      toast.success(t("superAdminConfig.configSaved"));
    } else {
      toast.error(t("superAdminConfig.configError"));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const PlanInputs = ({
    free,
    starter,
    pro,
    setFree,
    setStarter,
    setPro,
  }: {
    free: string;
    starter: string;
    pro: string;
    setFree: (v: string) => void;
    setStarter: (v: string) => void;
    setPro: (v: string) => void;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          {t("superAdminConfig.planFree")}
        </Label>
        <Input type="number" min={0} value={free} onChange={(e) => setFree(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          {t("superAdminConfig.planStarter")}
        </Label>
        <Input type="number" min={0} value={starter} onChange={(e) => setStarter(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          {t("superAdminConfig.planPro")}
        </Label>
        <Input type="number" min={0} value={pro} onChange={(e) => setPro(e.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="page-in p-6 md:p-10 space-y-10 max-w-5xl mx-auto">
      {/* Page header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <Settings className="h-3.5 w-3.5" />
          Super Admin
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
          {t("superAdminConfig.title")}
        </h1>
        <p className="text-muted-foreground text-base max-w-2xl">
          {t("superAdminConfig.subtitle")}
        </p>
      </header>

      {/* AI Engine */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Cpu className="h-5 w-5 text-primary" />
                {t("superAdminConfig.aiPrompt")}
              </CardTitle>
              <CardDescription>{t("superAdminConfig.aiPromptDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={8}
            className="font-mono text-xs leading-relaxed resize-y"
            placeholder={t("superAdminConfig.aiPromptPlaceholder")}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => saveConfig("ai_prompt", { text: aiPrompt })}
              disabled={saving === "ai_prompt"}
            >
              <Save className="h-4 w-4" />
              {saving === "ai_prompt" ? t("common.saving") : t("superAdminConfig.savePrompt")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credits System */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Sistema de Créditos
            </h2>
            <p className="text-sm text-muted-foreground">
              Bolsas mensuales por plan y costos por cada acción IA.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bolsas mensuales (créditos por plan)</CardTitle>
            <CardDescription>Cantidad de créditos que recibe cada plan al inicio del ciclo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanInputs
              free={allowFree} starter={allowStarter} pro={allowPro}
              setFree={setAllowFree} setStarter={setAllowStarter} setPro={setAllowPro}
            />
            <div className="flex justify-end">
              <Button
                onClick={() => saveConfig("credit_allowances", {
                  free: parseInt(allowFree) || 0,
                  starter: parseInt(allowStarter) || 0,
                  pro: parseInt(allowPro) || 0,
                })}
                disabled={saving === "credit_allowances"}
              >
                <Save className="h-4 w-4" />
                {saving === "credit_allowances" ? t("common.saving") : "Guardar bolsas"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Costos por acción</CardTitle>
            <CardDescription>Créditos descontados al ejecutar cada acción IA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["landing_text", "Landing solo texto"],
                ["landing_with_images", "Landing con imágenes IA"],
                ["banner_single", "Banner individual"],
                ["banner_aida_pack", "Pack AIDA (7 banners)"],
                ["regenerate_block", "Regenerar bloque landing"],
                ["regenerate_banner", "Regenerar banner"],
                ["design_critic", "Design Critic"],
                ["edit_banner_variation", "Editar banner (variación)"],
                ["dropi_image_single", "Dropi: 1 imagen IA"],
                ["dropi_image_pack_3", "Dropi: pack 3 imágenes"],
                ["dropi_image_pack_5", "Dropi: pack 5 imágenes"],
                ["dropi_ad_with_image", "Dropi: ad + imagen"],
                ["dropi_ad_pack_3", "Dropi: pack 3 ads"],
                ["dropi_regenerate_image", "Dropi: regenerar imagen"],
                ["shopify_export", "Exportar a Shopify"],
                ["publish_landing", "Publicar landing"],
              ].map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={creditCosts[key] ?? 0}
                    onChange={(e) => setCreditCosts((prev) => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => saveConfig("credit_costs", creditCosts)}
                disabled={saving === "credit_costs"}
              >
                <Save className="h-4 w-4" />
                {saving === "credit_costs" ? t("common.saving") : "Guardar costos"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default SuperAdminConfig;
