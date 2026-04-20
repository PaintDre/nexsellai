import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Payment {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  currency: string;
  provider: string;
  period: string;
  status: string;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
}

const statusColors: Record<string, string> = {
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  pending: "bg-warning/15 text-warning",
  rejected: "bg-destructive/15 text-destructive",
};

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPayments = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/payments`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
      setLoading(false);
    };
    fetchPayments();
  }, []);

  const formatAmount = (amount: number, currency: string) => {
    if (["USD", "EUR"].includes(currency)) {
      return `${currency === "EUR" ? "€" : "$"}${(amount / 100).toFixed(2)}`;
    }
    return `$${amount.toLocaleString()} ${currency}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-in p-4 md:p-6 lg:p-10 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <CreditCard className="h-3.5 w-3.5" /> {t("admin.eyebrow")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">{t("adminPayments.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("adminPayments.subtitle")} · {t("adminPayments.transactionsCount", { count: payments.length })}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
          <Link to="/admin"><ArrowLeft className="h-4 w-4" /> {t("common.back")}</Link>
        </Button>
      </div>

      {payments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">{t("adminPayments.noPayments")}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">{t("adminPayments.noPaymentsHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden sm:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-3 px-4">{t("adminPayments.user")}</th>
                      <th className="text-left py-3 px-4">{t("adminPayments.plan")}</th>
                      <th className="text-right py-3 px-4">{t("adminPayments.amount")}</th>
                      <th className="text-left py-3 px-4">{t("adminPayments.currency")}</th>
                      <th className="text-left py-3 px-4">{t("adminPayments.provider")}</th>
                      <th className="text-left py-3 px-4">{t("adminPayments.period")}</th>
                      <th className="text-left py-3 px-4">{t("adminPayments.status")}</th>
                      <th className="text-left py-3 px-4">{t("adminPayments.externalId")}</th>
                      <th className="text-left py-3 px-4">{t("adminPayments.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium truncate max-w-[160px]">{p.user_name || t("adminPayments.noName")}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{p.user_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize font-medium">{p.plan}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatAmount(p.amount, p.currency || "CLP")}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">{p.currency || "CLP"}</Badge>
                        </td>
                        <td className="py-3 px-4 capitalize text-xs">{p.provider || "mercadopago"}</td>
                        <td className="py-3 px-4 capitalize">{p.period}</td>
                        <td className="py-3 px-4">
                          <Badge className={statusColors[p.status] || "bg-muted text-muted-foreground"} variant="secondary">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{p.mp_payment_id || "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="sm:hidden space-y-3">
            {payments.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{p.user_name || t("adminPayments.noName")}</p>
                    <Badge className={statusColors[p.status] || "bg-muted text-muted-foreground"} variant="secondary">
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.user_email}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{p.plan} · {p.period}</span>
                    <span className="font-mono font-medium">{formatAmount(p.amount, p.currency || "CLP")}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{p.provider || "mercadopago"} · {p.currency || "CLP"}</span>
                    <span>
                      {new Date(p.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {p.mp_payment_id && (
                    <p className="text-xs text-muted-foreground font-mono">ID: {p.mp_payment_id}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPayments;
