import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Loader2, Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getPricingForCountry, formatPrice } from "@/lib/pricing";
import { COUNTRIES } from "@/lib/countries";
import { useTranslation } from "react-i18next";
import { useCredits } from "@/hooks/useCredits";

type BillingPeriod = "monthly" | "annual";

const Pricing = () => {
  const { t } = useTranslation();
  const { profile, session } = useAuth();
  const { allowances } = useCredits();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [selectedCountry, setSelectedCountry] = useState<string>(profile?.country_code || "US");

  useEffect(() => {
    if (profile?.country_code) {
      setSelectedCountry(profile.country_code);
    }
  }, [profile?.country_code]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast.success(t("pricing.paymentSuccess"));
    } else if (status === "failure") {
      toast.error(t("pricing.paymentFailure"));
    } else if (status === "pending") {
      toast.info(t("pricing.paymentPending"));
    }
  }, [searchParams, t]);

  const pricing = getPricingForCountry(selectedCountry);

  const planFeatures = {
    free: {
      name: t("pricing.plans.free.name"),
      description: t("pricing.plans.free.description"),
      features: t("pricing.plans.free.features", { returnObjects: true }) as string[],
      excluded: t("pricing.plans.free.excluded", { returnObjects: true }) as string[],
    },
    starter: {
      name: t("pricing.plans.starter.name"),
      description: t("pricing.plans.starter.description"),
      features: t("pricing.plans.starter.features", { returnObjects: true }) as string[],
      popular: true,
    },
    pro: {
      name: t("pricing.plans.pro.name"),
      description: t("pricing.plans.pro.description"),
      features: t("pricing.plans.pro.features", { returnObjects: true }) as string[],
    },
  };

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      toast.error(t("pricing.loginRequired"));
      return;
    }
    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId, billingPeriod, countryCode: selectedCountry },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t("pricing.paymentError"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPlanPrice = (planId: "starter" | "pro") => {
    const plan = pricing[planId];
    return billingPeriod === "annual" ? plan.annual : plan.monthly;
  };

  const getUsdEquiv = (planId: "starter" | "pro") => {
    const plan = pricing[planId];
    return billingPeriod === "annual" ? plan.usdEquiv.annual : plan.usdEquiv.monthly;
  };

  const getMonthlyEquiv = (planId: "starter" | "pro") => {
    if (billingPeriod === "annual") {
      const annual = pricing[planId].annual;
      return Math.round(annual / 12);
    }
    return null;
  };

  const isUSD = pricing.currency === "USD";

  return (
    <div className="p-5 md:p-8 lg:p-10 space-y-8">
      <Helmet>
        <title>Planes y precios | Nexsell</title>
        <meta name="description" content="Compara los planes Free, Starter y Pro de Nexsell. Créditos mensuales para generar landings y banners IA para tu ecommerce." />
        <link rel="canonical" href="https://nexsellai.com/pricing" />
        <meta property="og:title" content="Planes y precios | Nexsell" />
        <meta property="og:description" content="Compara los planes Free, Starter y Pro de Nexsell. Créditos mensuales para generar landings y banners IA para tu ecommerce." />
        <meta property="og:url" content="https://nexsellai.com/pricing" />
        <meta name="twitter:title" content="Planes y precios | Nexsell" />
        <meta name="twitter:description" content="Compara los planes Free, Starter y Pro de Nexsell. Créditos mensuales para generar landings y banners IA para tu ecommerce." />
      </Helmet>
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold font-display">{t("pricing.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("pricing.subtitle")}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as BillingPeriod)}>
            <TabsList className="h-9">
              <TabsTrigger value="monthly" className="text-xs">{t("pricing.monthly")}</TabsTrigger>
              <TabsTrigger value="annual" className="text-xs gap-1.5">
                {t("pricing.annual")} <Badge variant="secondary" className="text-[10px] bg-accent text-accent-foreground">-17%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <Globe className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code} className="text-xs">
                  {c.name} ({c.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
        {(["free", "starter", "pro"] as const).map((planId) => {
          const meta = planFeatures[planId];
          const isCurrent = profile?.plan === planId;
          const isLoading = loadingPlan === planId;
          const isPaid = planId !== "free";

          return (
            <Card key={planId} className={cn(
              "relative transition-all duration-200",
              "popular" in meta && meta.popular && "border-primary shadow-md ring-1 ring-primary/10"
            )}>
              {"popular" in meta && meta.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-2.5">{t("pricing.mostPopular")}</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-base">{meta.name}</CardTitle>
                <CardDescription className="text-xs">{meta.description}</CardDescription>
                <div className="mt-2 flex justify-center">
                  <Badge variant="secondary" className="gap-1.5 text-[11px] py-0.5 px-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {t("pricing.creditsPerMonth", { count: allowances[planId] ?? 0 })}
                  </Badge>
                </div>
                <div className="mt-3">
                  {!isPaid ? (
                    <span className="text-3xl font-bold font-display">{t("pricing.free")}</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold font-display">
                        {pricing.currencySymbol}{formatPrice(getPlanPrice(planId), pricing.currency, pricing.locale)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {pricing.currency}/{billingPeriod === "annual" ? t("pricing.perYear") : t("pricing.perMonth")}
                      </span>
                      {!isUSD && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ~USD ${getUsdEquiv(planId).toFixed(2)}
                        </p>
                      )}
                      {billingPeriod === "annual" && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {pricing.currencySymbol}{formatPrice(getMonthlyEquiv(planId)!, pricing.currency, pricing.locale)}/{t("pricing.perMonth")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5">
                  {meta.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {"excluded" in meta && (meta as any).excluded?.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground line-through">
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  size="sm"
                  variant={isCurrent ? "secondary" : ("popular" in meta && meta.popular) ? "default" : "outline"}
                  disabled={isCurrent || isLoading || !isPaid}
                  onClick={() => handleSubscribe(planId)}
                >
                  {isLoading ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("pricing.processing")}</>
                  ) : isCurrent ? (
                    t("pricing.currentPlan")
                  ) : !isPaid ? (
                    t("pricing.currentPlan")
                  ) : (
                    t("pricing.subscribe")
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {pricing.currency !== "CLP" && (
        <p className="text-center text-[11px] text-muted-foreground max-w-md mx-auto">
          {t("pricing.currencyNote", { currency: pricing.currency })}
        </p>
      )}
    </div>
  );
};

export default Pricing;
