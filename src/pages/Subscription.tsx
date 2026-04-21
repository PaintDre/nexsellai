import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Calendar, CheckCircle2, AlertCircle, Sparkles, ArrowUpRight, Receipt, Clock } from "lucide-react";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";
import { useCredits } from "@/hooks/useCredits";
import { Coins } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Subscription = Tables<"subscriptions">;
type Payment = Tables<"payments">;

const planMeta: Record<string, { label: string; tone: string; ring: string }> = {
  free: { label: "Free", tone: "bg-muted text-muted-foreground", ring: "ring-muted" },
  starter: { label: "Starter", tone: "bg-warning/15 text-warning", ring: "ring-warning/30" },
  pro: { label: "Pro", tone: "bg-primary/15 text-primary", ring: "ring-primary/30" },
};

const Subscription = () => {
  const { t, i18n } = useTranslation();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { balance, allowance, resetAt } = useCredits();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const locale = i18n.language?.startsWith("es") ? es : undefined;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: subs }, { data: pays }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(1),
        supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      setSubscription(subs?.[0] || null);
      setPayments(pays || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const plan = profile?.plan || "free";
  const meta = planMeta[plan] || planMeta.free;
  const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
  const isActive = plan !== "free" && expiresAt && isAfter(expiresAt, new Date());
  const isExpired = plan !== "free" && expiresAt && !isAfter(expiresAt, new Date());

  const formatAmount = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(i18n.language || "es", {
        style: "currency",
        currency: currency || "CLP",
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${amount} ${currency}`;
    }
  };

  return (
    <div className="container max-w-4xl py-8 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold font-display tracking-tight">
          {t("subscription.title", "Mi suscripción")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("subscription.subtitle", "Revisa el estado de tu plan y gestiona tu suscripción.")}
        </p>
      </div>

      {/* Current plan card */}
      <Card className={cn("overflow-hidden border-2", isActive && "ring-2", meta.ring)}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <CardDescription className="text-xs uppercase tracking-wider">
                {t("subscription.currentPlan", "Plan actual")}
              </CardDescription>
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl font-display">{meta.label}</CardTitle>
                {plan === "free" ? (
                  <Badge variant="secondary">{t("subscription.statusFree", "Gratis")}</Badge>
                ) : isActive ? (
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/20 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {t("subscription.statusActive", "Activa")}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" /> {t("subscription.statusExpired", "Expirada")}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {plan === "free" ? (
                <Button onClick={() => navigate("/pricing")} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t("subscription.upgrade", "Actualizar plan")}
                </Button>
              ) : (
                <Button onClick={() => navigate("/pricing")} variant="outline" className="gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  {isExpired
                    ? t("subscription.renew", "Renovar plan")
                    : t("subscription.manage", "Gestionar plan")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {expiresAt && (
                <div className="rounded-lg border bg-muted/30 p-3 flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {isExpired
                        ? t("subscription.expiredOn", "Expiró el")
                        : t("subscription.renewsOn", "Vence el")}
                    </p>
                    <p className="text-sm font-medium">
                      {format(expiresAt, "PPP", { locale })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(expiresAt, { addSuffix: true, locale })}
                    </p>
                  </div>
                </div>
              )}
              {subscription && (
                <div className="rounded-lg border bg-muted/30 p-3 flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {t("subscription.startedOn", "Activada el")}
                    </p>
                    <p className="text-sm font-medium">
                      {format(new Date(subscription.started_at), "PPP", { locale })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {isExpired && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {t(
                "subscription.expiredNotice",
                "Tu suscripción expiró. Renueva para recuperar el acceso completo a tu plan."
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            {t("subscription.creditsTitle", "Créditos disponibles")}
          </CardTitle>
          <CardDescription>
            {t("subscription.creditsDesc", "Tu plan incluye una bolsa mensual de créditos para todas las generaciones IA.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("subscription.balance", "Saldo")}</p>
                <p className="text-3xl font-bold mt-1 tabular-nums">{balance}</p>
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">/ {allowance}</p>
            </div>
            <Progress
              value={allowance > 0 ? Math.min(100, (balance / allowance) * 100) : 0}
              className="h-2"
            />
            {resetAt && (
              <p className="text-xs text-muted-foreground">
                {t("subscription.resetAt", "Próxima recarga")}:{" "}
                {format(new Date(new Date(resetAt).getTime() + 30 * 24 * 60 * 60 * 1000), "PPP", { locale })}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link to="/pricing">
              <Sparkles className="h-4 w-4" /> {t("subscription.getMore", "Conseguir más créditos")}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            {t("subscription.recentPayments", "Pagos recientes")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("subscription.noPayments", "Aún no hay pagos registrados.")}
            </p>
          ) : (
            <ul className="divide-y">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize truncate">
                        {p.plan} · {p.period === "annual" ? t("subscription.annual", "Anual") : t("subscription.monthly", "Mensual")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(p.created_at), "PP", { locale })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatAmount(p.amount, p.currency)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.provider}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        {t("subscription.help", "¿Necesitas ayuda con tu suscripción?")}{" "}
        <Link to="/settings" className="underline hover:text-primary">
          {t("subscription.contactSupport", "Contáctanos desde Ajustes")}
        </Link>
      </p>
    </div>
  );
};

export default Subscription;