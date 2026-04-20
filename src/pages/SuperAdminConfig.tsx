import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, Cpu, Gauge, Layers, Image as ImageIcon, Megaphone } from "lucide-react";
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
  const [limitFree, setLimitFree] = useState("1");
  const [limitStarter, setLimitStarter] = useState("10");
  const [limitPro, setLimitPro] = useState("100");
  const [bannerLimitFree, setBannerLimitFree] = useState("2");
  const [bannerLimitStarter, setBannerLimitStarter] = useState("30");
  const [bannerLimitPro, setBannerLimitPro] = useState("150");
  const [dropiLimitFree, setDropiLimitFree] = useState("1");
  const [dropiLimitStarter, setDropiLimitStarter] = useState("30");
  const [dropiLimitPro, setDropiLimitPro] = useState("150");
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
        const dLimits = items.find((c) => c.key === "dropi_ads_limits");
        if (dLimits) {
          setDropiLimitFree(String(dLimits.value?.free ?? 1));
          setDropiLimitStarter(String(dLimits.value?.starter ?? 30));
          setDropiLimitPro(String(dLimits.value?.pro ?? 150));
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

      {/* Usage allowance section */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Gauge className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {t("superAdminConfig.sectionUsageLimits")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("superAdminConfig.sectionUsageLimitsDesc")}
            </p>
          </div>
        </div>

        {/* Landings */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="h-4.5 w-4.5 text-primary" />
                  {t("superAdminConfig.landingLimits")}
                </CardTitle>
                <CardDescription>{t("superAdminConfig.landingLimitsDesc")}</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-medium">
                {t("superAdminConfig.cyclePill")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanInputs
              free={limitFree}
              starter={limitStarter}
              pro={limitPro}
              setFree={setLimitFree}
              setStarter={setLimitStarter}
              setPro={setLimitPro}
            />
            <div className="flex justify-end">
              <Button
                onClick={() =>
                  saveConfig("plan_limits", {
                    free: parseInt(limitFree) || 0,
                    starter: parseInt(limitStarter) || 0,
                    pro: parseInt(limitPro) || 0,
                  })
                }
                disabled={saving === "plan_limits"}
              >
                <Save className="h-4 w-4" />
                {saving === "plan_limits" ? t("common.saving") : t("superAdminConfig.saveLandingLimits")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Banners */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="h-4.5 w-4.5 text-primary" />
                  {t("superAdminConfig.bannerLimits")}
                </CardTitle>
                <CardDescription>{t("superAdminConfig.bannerLimitsDesc")}</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-medium">
                {t("superAdminConfig.cyclePill")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanInputs
              free={bannerLimitFree}
              starter={bannerLimitStarter}
              pro={bannerLimitPro}
              setFree={setBannerLimitFree}
              setStarter={setBannerLimitStarter}
              setPro={setBannerLimitPro}
            />
            <div className="flex justify-end">
              <Button
                onClick={() =>
                  saveConfig("banner_limits", {
                    free: parseInt(bannerLimitFree) || 0,
                    starter: parseInt(bannerLimitStarter) || 0,
                    pro: parseInt(bannerLimitPro) || 0,
                  })
                }
                disabled={saving === "banner_limits"}
              >
                <Save className="h-4 w-4" />
                {saving === "banner_limits" ? t("common.saving") : t("superAdminConfig.saveBannerLimits")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dropi Ads */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Megaphone className="h-4.5 w-4.5 text-primary" />
                  {t("superAdminConfig.dropiAdsLimits")}
                </CardTitle>
                <CardDescription>{t("superAdminConfig.dropiAdsLimitsDesc")}</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-medium">
                {t("superAdminConfig.cyclePill")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanInputs
              free={dropiLimitFree}
              starter={dropiLimitStarter}
              pro={dropiLimitPro}
              setFree={setDropiLimitFree}
              setStarter={setDropiLimitStarter}
              setPro={setDropiLimitPro}
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("superAdminConfig.dropiAdsLimitsHint")}
            </p>
            <div className="flex justify-end">
              <Button
                onClick={() =>
                  saveConfig("dropi_ads_limits", {
                    free: parseInt(dropiLimitFree) || 0,
                    starter: parseInt(dropiLimitStarter) || 0,
                    pro: parseInt(dropiLimitPro) || 0,
                  })
                }
                disabled={saving === "dropi_ads_limits"}
              >
                <Save className="h-4 w-4" />
                {saving === "dropi_ads_limits"
                  ? t("common.saving")
                  : t("superAdminConfig.saveDropiAdsLimits")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default SuperAdminConfig;
