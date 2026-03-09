import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BillingPeriod = "monthly" | "annual";

const plans = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Explora Nexsell sin costo",
    features: [
      "1 landing total",
      "2 banners / mes",
      "1 hook de venta",
      "Preview de landing",
      "Exportar HTML básico",
    ],
    excluded: ["Sin imágenes IA", "Sin edición avanzada"],
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 14990,
    annualPrice: 149900,
    description: "Ideal para lanzar y testear productos",
    features: [
      "10 landings / mes",
      "30 banners / mes",
      "3 hooks por producto",
      "Imágenes IA en landings",
      "Objeciones y urgencia",
      "FAQs editables",
      "Exportar HTML + CSS",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 34990,
    annualPrice: 349900,
    description: "Para vendedores que escalan con ads",
    features: [
      "100 landings / mes",
      "150 banners / mes",
      "Ángulos psicológicos ilimitados",
      "Imágenes IA en landings",
      "Hooks optimizados para ads",
      "Variantes de CTA",
      "Bundles y comparativas",
      "Microcopys de checkout",
      "Exportar ZIP completo",
    ],
  },
];

const Pricing = () => {
  const { profile, session } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast.success("¡Pago exitoso! Tu plan se actualizará en unos momentos.");
    } else if (status === "failure") {
      toast.error("El pago no pudo completarse. Intenta nuevamente.");
    } else if (status === "pending") {
      toast.info("Tu pago está pendiente de confirmación.");
    }
  }, [searchParams]);

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      toast.error("Debes iniciar sesión para suscribirte.");
      return;
    }

    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId, billingPeriod },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió URL de checkout");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error al iniciar el pago. Intenta nuevamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPrice = (plan: typeof plans[0]) => {
    return billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice;
  };

  const getMonthlyEquivalent = (plan: typeof plans[0]) => {
    if (billingPeriod === "annual" && plan.annualPrice > 0) {
      return Math.round(plan.annualPrice / 12);
    }
    return null;
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold font-display">Planes y Precios</h1>
        <p className="text-sm text-muted-foreground">Elige el plan que mejor se adapte a tu volumen de ventas</p>

        <div className="flex justify-center pt-1">
          <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as BillingPeriod)}>
            <TabsList className="h-9">
              <TabsTrigger value="monthly" className="text-xs">Mensual</TabsTrigger>
              <TabsTrigger value="annual" className="text-xs gap-1.5">
                Anual <Badge variant="secondary" className="text-[10px] bg-accent text-accent-foreground">-17%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = profile?.plan === plan.id;
          const price = getPrice(plan);
          const monthlyEq = getMonthlyEquivalent(plan);
          const isLoading = loadingPlan === plan.id;

          return (
            <Card key={plan.id} className={cn(
              "relative transition-all duration-200",
              plan.popular && "border-primary shadow-md ring-1 ring-primary/10"
            )}>
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-2.5">Más popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-base">{plan.name}</CardTitle>
                <CardDescription className="text-xs">{plan.description}</CardDescription>
                <div className="mt-3">
                  {price === 0 ? (
                    <span className="text-3xl font-bold font-display">Gratis</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold font-display">
                        ${price.toLocaleString("es-CL")}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        /{billingPeriod === "annual" ? "año" : "mes"}
                      </span>
                      {monthlyEq && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ${monthlyEq.toLocaleString("es-CL")}/mes
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.excluded?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground line-through">
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  size="sm"
                  variant={isCurrent ? "secondary" : plan.popular ? "default" : "outline"}
                  disabled={isCurrent || isLoading || plan.id === "free"}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {isLoading ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Procesando...</>
                  ) : isCurrent ? (
                    "Plan actual"
                  ) : plan.id === "free" ? (
                    "Plan actual"
                  ) : (
                    "Suscribirse"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;
