// Shared server-side credits enforcement for AI-generation Edge Functions.
// IMPORTANT: never trust costs/balances from request body — always derive from DB.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  | "publish_landing"
  | "product_video";

// Hard-coded fallback costs (DB values in system_config win when present).
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
  product_video: 40,
};

const FALLBACK_ALLOWANCES: Record<string, number> = {
  free: 30,
  starter: 300,
  pro: 1500,
};

export async function getCostForAction(
  supabase: SupabaseClient,
  action: CreditAction,
): Promise<number> {
  const { data } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", "credit_costs")
    .maybeSingle();
  const cfg = (data?.value ?? {}) as Record<string, number>;
  const cost = cfg[action];
  return typeof cost === "number" && cost >= 0 ? cost : FALLBACK_COSTS[action];
}

export async function getAllowanceForPlan(
  supabase: SupabaseClient,
  plan: string,
): Promise<number> {
  const { data } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", "credit_allowances")
    .maybeSingle();
  const cfg = (data?.value ?? {}) as Record<string, number>;
  return typeof cfg[plan] === "number" ? cfg[plan] : (FALLBACK_ALLOWANCES[plan] ?? FALLBACK_ALLOWANCES.free);
}

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string,
): Promise<"free" | "starter" | "pro"> {
  const nowIso = new Date().toISOString();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, status, expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sub?.plan_id === "starter" || sub?.plan_id === "pro") return sub.plan_id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return "free";
  if (profile.plan === "free") return "free";
  if (profile.plan_expires_at && new Date(profile.plan_expires_at) <= new Date()) return "free";
  return profile.plan as "free" | "starter" | "pro";
}

/**
 * Ensures the user has a fresh monthly grant if their last reset is older than 30 days
 * (or they have never received credits, or their plan changed).
 */
export async function ensureMonthlyGrant(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const plan = await getUserPlan(supabase, userId);
  const allowance = await getAllowanceForPlan(supabase, plan);
  await supabase.rpc("grant_monthly_credits", {
    _user_id: userId,
    _plan: plan,
    _amount: allowance,
    _force: false,
  });
}

export interface ChargeResult {
  success: boolean;
  transactionId?: string;
  balance?: number;
  charged?: number;
  required?: number;
  error?: string;
}

/**
 * Atomically charges credits for an action. Returns insufficient_credits when the
 * balance is too low — caller should respond with HTTP 402 in that case.
 */
export async function chargeCredits(
  supabase: SupabaseClient,
  userId: string,
  action: CreditAction,
  resourceId?: string | null,
  metadata: Record<string, unknown> = {},
): Promise<ChargeResult> {
  await ensureMonthlyGrant(supabase, userId);
  const cost = await getCostForAction(supabase, action);
  if (cost === 0) {
    return { success: true, balance: undefined, charged: 0 };
  }
  const { data, error } = await supabase.rpc("charge_credits", {
    _user_id: userId,
    _amount: cost,
    _action: action,
    _resource_id: resourceId ?? null,
    _metadata: metadata,
  });
  if (error) {
    console.error("[credits] charge error:", error);
    return { success: false, error: "charge_failed" };
  }
  const r = (data ?? {}) as Record<string, unknown>;
  return {
    success: r.success === true,
    transactionId: r.transaction_id as string | undefined,
    balance: r.balance as number | undefined,
    charged: r.charged as number | undefined,
    required: r.required as number | undefined,
    error: r.error as string | undefined,
  };
}

export async function refundCredits(
  supabase: SupabaseClient,
  transactionId: string,
  reason = "generation_failed",
): Promise<void> {
  if (!transactionId) return;
  await supabase.rpc("refund_credits", {
    _transaction_id: transactionId,
    _reason: reason,
  });
}

export function insufficientCreditsResponse(
  result: ChargeResult,
  corsHeaders: Record<string, string>,
  action: CreditAction,
): Response {
  return new Response(
    JSON.stringify({
      error: "insufficient_credits",
      action,
      balance: result.balance ?? 0,
      required: result.required ?? 0,
      upgrade_url: "/pricing",
    }),
    {
      status: 402,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
