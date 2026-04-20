import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Settings, Save, Cpu, Sliders } from "lucide-react";
import { useTranslation } from "react-i18next";

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
    setSaving(true);
    const headers = await getHeaders();
    const res = await fetch(`${baseUrl}/config`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ key, value }),
    });
    setSaving(false);
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

  return (
    <div className="page-in p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-7 w-7" /> {t("superAdminConfig.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("superAdminConfig.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" /> {t("superAdminConfig.aiPrompt")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={8}
            placeholder={t("superAdminConfig.aiPromptPlaceholder")}
          />
          <Button onClick={() => saveConfig("ai_prompt", { text: aiPrompt })} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {t("superAdminConfig.savePrompt")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sliders className="h-5 w-5" /> {t("superAdminConfig.landingLimits")}</CardTitle>
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
            <Save className="h-4 w-4 mr-2" /> {t("superAdminConfig.saveLandingLimits")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sliders className="h-5 w-5" /> {t("superAdminConfig.bannerLimits")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Free</Label>
              <Input type="number" value={bannerLimitFree} onChange={(e) => setBannerLimitFree(e.target.value)} />
            </div>
            <div>
              <Label>Starter</Label>
              <Input type="number" value={bannerLimitStarter} onChange={(e) => setBannerLimitStarter(e.target.value)} />
            </div>
            <div>
              <Label>Pro</Label>
              <Input type="number" value={bannerLimitPro} onChange={(e) => setBannerLimitPro(e.target.value)} />
            </div>
          </div>
          <Button
            onClick={() => saveConfig("banner_limits", {
              free: parseInt(bannerLimitFree) || 2,
              starter: parseInt(bannerLimitStarter) || 30,
              pro: parseInt(bannerLimitPro) || 150,
            })}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" /> {t("superAdminConfig.saveBannerLimits")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" /> {t("superAdminConfig.dropiAdsLimits")}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t("superAdminConfig.dropiAdsLimitsDesc")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Free</Label>
              <Input type="number" min={0} value={dropiLimitFree} onChange={(e) => setDropiLimitFree(e.target.value)} />
            </div>
            <div>
              <Label>Starter</Label>
              <Input type="number" min={0} value={dropiLimitStarter} onChange={(e) => setDropiLimitStarter(e.target.value)} />
            </div>
            <div>
              <Label>Pro</Label>
              <Input type="number" min={0} value={dropiLimitPro} onChange={(e) => setDropiLimitPro(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("superAdminConfig.dropiAdsLimitsHint")}
          </p>
          <Button
            onClick={() => saveConfig("dropi_ads_limits", {
              free: parseInt(dropiLimitFree) || 0,
              starter: parseInt(dropiLimitStarter) || 0,
              pro: parseInt(dropiLimitPro) || 0,
            })}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" /> {t("superAdminConfig.saveDropiAdsLimits")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminConfig;
