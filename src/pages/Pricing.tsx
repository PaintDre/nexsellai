import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Para probar Nexsell",
    features: [
      "1 landing total",
      "1 ángulo / 1 hook",
      "Exportar HTML básico",
      "Listo para Shopify",
    ],
    excluded: ["Sin objeciones fuertes", "Sin urgencia avanzada", "Sin bundles / upsell"],
  },
  {
    id: "starter",
    name: "Starter",
    price: 7990,
    description: "Para testear 2-3 productos/mes",
    features: [
      "10 landings / mes",
      "3 hooks por producto",
      "Objeciones básicas",
      "Bloque de urgencia editable",
      "FAQs simples",
      "Exportar HTML + CSS",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 14990,
    description: "Para correr ads diario",
    features: [
      "100 landings / mes",
      "Múltiples ángulos psicológicos",
      "Hooks para ads incluidos",
      "Variantes de CTA",
      "Sección de bundles",
      "Comparativa vs otros",
      "Microcopys de checkout",
      "Versión corta para producto",
      "Exportar ZIP completo",
    ],
  },
];

const Pricing = () => {
  const { profile } = useAuth();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold font-display tracking-tight">Planes y Precios</h1>
        <p className="text-muted-foreground mt-2">Elige el plan que se ajuste a tu volumen de ventas</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = profile?.plan === plan.id;
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
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold font-display">Gratis</span>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold font-display">${plan.price.toLocaleString("es-CL")}</span>
                      <span className="text-muted-foreground">/mes</span>
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
                  className="w-full"
                  variant={isCurrent ? "secondary" : plan.popular ? "default" : "outline"}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Plan actual" : plan.price === 0 ? "Plan actual" : "Suscribirse"}
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
