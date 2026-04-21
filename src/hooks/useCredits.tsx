import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CreditAction =
  | "landing_text"
  | "landing_with_images"
  | "banner_single"
  | "banner_aida_pack"
  | "regenerate_block"
  | "regenerate_banner"
  | "design_critic"
  | "edit_banner_variation"
  | "dropi_image_single"
  | "dropi_image_pack_3"
  | "dropi_image_pack_5"
  | "dropi_ad_with_image"
  | "dropi_ad_pack_3"
  | "dropi_regenerate_image"
  | "shopify_export"
  | "publish_landing";

const FALLBACK_COSTS: Record<CreditAction, number> = {
  landing_text: 10,
  landing_with_images: 25,
  banner_single: 5,
  banner_aida_pack: 30,
  regenerate_block: 3,
  regenerate_banner: 4,
  design_critic: 2,
  edit_banner_variation: 4,
  dropi_image_single: 5,
  dropi_image_pack_3: 12,
  dropi_image_pack_5: 20,
  dropi_ad_with_image: 8,
  dropi_ad_pack_3: 22,
  dropi_regenerate_image: 4,
  shopify_export: 0,
  publish_landing: 0,
};

const FALLBACK_ALLOWANCES: Record<string, number> = {
  free: 30,
  starter: 300,
  pro: 1500,
};

interface CreditsContextValue {
  balance: number;
  allowance: number;
  resetAt: string | null;
  costs: Record<CreditAction, number>;
  allowances: Record<string, number>;
  loading: boolean;
  refresh: () => Promise<void>;
  costOf: (action: CreditAction) => number;
}

const CreditsContext = createContext<CreditsContextValue | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [resetAt, setResetAt] = useState<string | null>(null);
  const [costs, setCosts] = useState<Record<CreditAction, number>>(FALLBACK_COSTS);
  const [allowances, setAllowances] = useState<Record<string, number>>(FALLBACK_ALLOWANCES);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setResetAt(null);
      setLoading(false);
      return;
    }
    const [{ data: cfg }, { data: prof }] = await Promise.all([
      supabase
        .from("system_config")
        .select("key, value")
        .in("key", ["credit_costs", "credit_allowances"]),
      supabase
        .from("profiles")
        .select("credits_balance, credits_reset_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (cfg) {
      for (const row of cfg) {
        if (row.key === "credit_costs" && row.value) {
          setCosts({ ...FALLBACK_COSTS, ...(row.value as Record<CreditAction, number>) });
        }
        if (row.key === "credit_allowances" && row.value) {
          setAllowances({ ...FALLBACK_ALLOWANCES, ...(row.value as Record<string, number>) });
        }
      }
    }
    if (prof) {
      setBalance((prof as any).credits_balance ?? 0);
      setResetAt((prof as any).credits_reset_at ?? null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: refresh whenever the profile row changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`credits-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { credits_balance?: number; credits_reset_at?: string };
          if (typeof row.credits_balance === "number") setBalance(row.credits_balance);
          if (row.credits_reset_at) setResetAt(row.credits_reset_at);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const allowance = useMemo(() => {
    const plan = profile?.plan || "free";
    return allowances[plan] ?? FALLBACK_ALLOWANCES.free;
  }, [profile, allowances]);

  const costOf = useCallback(
    (action: CreditAction) => costs[action] ?? FALLBACK_COSTS[action] ?? 0,
    [costs],
  );

  const value = useMemo<CreditsContextValue>(
    () => ({ balance, allowance, resetAt, costs, allowances, loading, refresh, costOf }),
    [balance, allowance, resetAt, costs, allowances, loading, refresh, costOf],
  );

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    throw new Error("useCredits must be used inside CreditsProvider");
  }
  return ctx;
}

/** Helper to detect 402/insufficient_credits responses from Edge Functions. */
export function isInsufficientCreditsError(error: unknown): boolean {
  if (!error) return false;
  const ctx = (error as { context?: { status?: number; body?: unknown } }).context;
  if (ctx?.status === 402) return true;
  let body: any = ctx?.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { /* */ }
  }
  return body?.error === "insufficient_credits";
}

/** Helper to detect Free-plan landing limit responses from Edge Functions. */
export function isFreeLimitReachedError(error: unknown): boolean {
  if (!error) return false;
  const ctx = (error as { context?: { status?: number; body?: unknown } }).context;
  let body: any = ctx?.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { /* */ }
  }
  return body?.error === "free_limit_reached";
}

/** Helper to detect Free-plan Dropi AI generation limit responses. */
export function isFreeDropiLimitReachedError(error: unknown): boolean {
  if (!error) return false;
  const ctx = (error as { context?: { status?: number; body?: unknown } }).context;
  let body: any = ctx?.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { /* */ }
  }
  return body?.error === "free_dropi_limit_reached";
}
