import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Lock, Trash2, HelpCircle, MessageSquare, Zap, Image, Palette, Sun, Moon, Monitor, Globe, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { computeBannersUsed } from "@/lib/planUsage";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { cn } from "@/lib/utils";
import { COUNTRIES, getCountryByCode } from "@/lib/countries";
import { useTranslation } from "react-i18next";
import AdminBannersGallery from "@/components/settings/AdminBannersGallery";

const LANGUAGE_OPTIONS = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

const SettingsPage = () => {
  const { user, profile, refreshProfile, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [defaultIntensity, setDefaultIntensity] = useState(() => localStorage.getItem("pref_intensity") || "medium");
  const [defaultMode, setDefaultMode] = useState(() => localStorage.getItem("pref_mode") || "aida");

  const [regionCountry, setRegionCountry] = useState("");
  const [regionCurrency, setRegionCurrency] = useState("USD");
  const [regionTimezone, setRegionTimezone] = useState("");
  const [savingRegion, setSavingRegion] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setRegionCountry((profile as any).country_code || "");
      setRegionCurrency((profile as any).currency || "USD");
      setRegionTimezone((profile as any).timezone || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      toast.success(t("settings.account.profileUpdated"));
      await refreshProfile();
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error(t("settings.account.passwordMinLength"));
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      toast.success(t("settings.account.passwordUpdated"));
      setNewPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    toast(t("settings.account.deleteAccountContact"), { description: t("settings.account.deleteAccountContactDesc") });
  };

  const handleSavePreferences = () => {
    localStorage.setItem("pref_intensity", defaultIntensity);
    localStorage.setItem("pref_mode", defaultMode);
    toast.success(t("settings.preferences.saved"));
  };

  const handleLanguageChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
    if (user) {
      await supabase
        .from("profiles")
        .update({ language: lang } as any)
        .eq("user_id", user.id);
    }
    toast.success(t("settings.language.saved"));
  };

  const { landing: landingLimits, banner: bannerLimits } = usePlanLimits();
  const plan = profile?.plan || "free";
  const landingsUsed = profile?.landings_used || 0;
  const limit = landingLimits[plan] || 1;
  const usagePercent = Math.min((landingsUsed / limit) * 100, 100);

  const bannerLimit = bannerLimits[plan] || 2;
  const bannersUsed = computeBannersUsed(profile);
  const bannerUsagePercent = Math.min((bannersUsed / bannerLimit) * 100, 100);

  const themeOptions = [
    { value: "light", label: t("settings.appearance.light"), icon: Sun },
    { value: "dark", label: t("settings.appearance.dark"), icon: Moon },
    { value: "system", label: t("settings.appearance.system"), icon: Monitor },
  ];

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold font-display">{t("settings.title")}</h1>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">{t("settings.account.title")}</CardTitle>
          <CardDescription>{t("settings.account.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("settings.account.email")}</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">{t("settings.account.name")}</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving || fullName === (profile?.full_name || "")} size="sm" className="w-full sm:w-auto">
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? t("settings.account.saving") : t("settings.account.saveName")}
          </Button>

          <div className="border-t pt-4 space-y-2">
            <Label htmlFor="newPassword" className="text-xs">{t("settings.account.changePassword")}</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="newPassword"
                type="password"
                placeholder={t("settings.account.newPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                <Lock className="h-3.5 w-3.5 mr-1.5" /> {changingPassword ? t("settings.account.changing") : t("settings.account.change")}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> {t("settings.account.deleteAccount")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("settings.account.deleteAccountTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("settings.account.deleteAccountDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t("common.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> {t("settings.appearance.title")}
          </CardTitle>
          <CardDescription>{t("settings.appearance.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all duration-200",
                  theme === opt.value
                    ? "border-primary bg-accent"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
              >
                <opt.icon className={cn("h-4 w-4", theme === opt.value ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" /> {t("settings.language.title")}
          </CardTitle>
          <CardDescription>{t("settings.language.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("settings.language.label")}</Label>
            <Select value={i18n.language?.substring(0, 2) || "es"} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Region */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> {t("settings.region.title")}
          </CardTitle>
          <CardDescription>{t("settings.region.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("settings.region.country")}</Label>
            <Select value={regionCountry} onValueChange={(v) => {
              setRegionCountry(v);
              const c = getCountryByCode(v);
              if (c) setRegionCurrency(c.currency);
            }}>
              <SelectTrigger><SelectValue placeholder={t("settings.region.countryPlaceholder")} /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("settings.region.currency")}</Label>
            <Select value={regionCurrency} onValueChange={setRegionCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[...new Set(COUNTRIES.map(c => c.currency))].map((cur) => (
                  <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {regionTimezone && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t("settings.region.timezone")}</Label>
              <Input value={regionTimezone} disabled className="bg-muted/50 text-xs" />
            </div>
          )}
          <Button
            onClick={async () => {
              if (!user) return;
              setSavingRegion(true);
              const { error } = await supabase
                .from("profiles")
                .update({ country_code: regionCountry || null, currency: regionCurrency, timezone: regionTimezone } as any)
                .eq("user_id", user.id);
              setSavingRegion(false);
              if (error) toast.error("Error", { description: error.message });
              else { toast.success(t("settings.region.updated")); await refreshProfile(); }
            }}
            disabled={savingRegion}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" /> {savingRegion ? t("settings.region.saving") : t("settings.region.save")}
          </Button>
        </CardContent>
      </Card>

      {/* Plan & Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> {t("settings.plan.title")}
          </CardTitle>
          <CardDescription>{t("settings.plan.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("settings.plan.currentPlan")}</span>
            <span className="font-medium text-sm capitalize">{plan}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span>{t("settings.plan.landingsUsed")}</span>
              <span className="font-medium">{landingsUsed} / {limit}</span>
            </div>
            <Progress value={usagePercent} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1"><Image className="h-3 w-3" /> {t("settings.plan.bannersUsed")}</span>
              <span className="font-medium">{bannersUsed} / {bannerLimit}</span>
            </div>
            <Progress value={bannerUsagePercent} className="h-1.5" />
          </div>
          {plan !== "pro" && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/pricing">{t("settings.plan.upgrade")}</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {isAdmin() && (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">{t("settings.preferences.title")}</CardTitle>
          <CardDescription>{t("settings.preferences.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("settings.preferences.intensity")}</Label>
            <Select value={defaultIntensity} onValueChange={setDefaultIntensity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">{t("settings.preferences.intensitySoft")}</SelectItem>
                <SelectItem value="medium">{t("settings.preferences.intensityMedium")}</SelectItem>
                <SelectItem value="hard">{t("settings.preferences.intensityHard")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("settings.preferences.framework")}</Label>
            <Select value={defaultMode} onValueChange={setDefaultMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aida">AIDA</SelectItem>
                <SelectItem value="standard">Estándar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSavePreferences} variant="outline" size="sm" className="w-full sm:w-auto">
            <Save className="h-3.5 w-3.5 mr-1.5" /> {t("settings.preferences.save")}
          </Button>
        </CardContent>
      </Card>
      )}

      {isAdmin() && <AdminBannersGallery />}

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> {t("settings.help.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <a href="mailto:soporte@nexsell.ai" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="h-3.5 w-3.5" /> {t("settings.help.report")}
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
