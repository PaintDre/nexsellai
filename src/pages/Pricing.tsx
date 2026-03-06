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
    description: "Ideal para lanzar y testear productos cada mes",
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
    description: "Para vendedores que escalan con ads todos los días",
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
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold font-display tracking-tight">Planes y Precios</h1>
        <p className="text-muted-foreground">Elige el plan que mejor se adapte a tu volumen de ventas</p>

        <div className="flex justify-center">
          <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as BillingPeriod)}>
            <TabsList>
              <TabsTrigger value="monthly">Mensual</TabsTrigger>
              <TabsTrigger value="annual" className="gap-2">
                Anual <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Ahorra 2 meses</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = profile?.plan === plan.id;
          const price = getPrice(plan);
          const monthlyEq = getMonthlyEquivalent(plan);
          const isLoading = loadingPlan === plan.id;

          return (
            <Card key={plan.id} className={cn("relative", plan.popular && "border-primary shadow-lg")}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Más popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  {price === 0 ? (
                    <span className="text-4xl font-bold font-display">Gratis</span>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold font-display">
                        ${price.toLocaleString("es-CL")}
                      </span>
                      <span className="text-muted-foreground">
                        /{billingPeriod === "annual" ? "año" : "mes"}
                      </span>
                      {monthlyEq && (
                        <p className="text-sm text-muted-foreground mt-1">
                          ${monthlyEq.toLocaleString("es-CL")}/mes
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.excluded?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full min-h-[44px]"
                  variant={isCurrent ? "secondary" : plan.popular ? "default" : "outline"}
                  disabled={isCurrent || isLoading || plan.id === "free"}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
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
