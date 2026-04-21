// Shared server-side plan limit enforcement for AI-generation Edge Functions.
// IMPORTANT: never trust the plan coming from the request body — always derive
// it from the database (active subscription first, then profile fallback).

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type PlanId = "free" | "starter" | "pro";
export type Resource = "landings" | "banners";

// `null` means unlimited. Spec from product:
//   landings: free=3, starter=25, pro=unlimited
//   banners:  free=2, starter=10, pro=unlimited
export const PLAN_LIMITS: Record<Resource, Record<PlanId, number | null>> = {
  landings: { free: 3, starter: 25, pro: null },
  banners: { free: 2, starter: 10, pro: null },
};

export function getLimitsForPlan(plan: PlanId) {
  return {
    landings: PLAN_LIMITS.landings[plan],
    banners: PLAN_LIMITS.banners[plan],
  };
}

function normalizePlan(value: string | null | undefined): PlanId {
  if (value === "starter" || value === "pro") return value;
  return "free";
}

/**
 * Resolves the effective plan for a user. Priority:
 *   1. Most recent active subscription whose `expires_at` is in the future.
 *   2. `profiles.plan` (if `plan_expires_at` is in the future or missing for free).
 *   3. "free".
 */
export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlanId> {
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

  if (sub?.plan_id) return normalizePlan(sub.plan_id as string);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return "free";

  const plan = normalizePlan(profile.plan);
  if (plan === "free") return "free";

  // Paid plan must still be within validity window
  if (profile.plan_expires_at && new Date(profile.plan_expires_at) <= new Date()) {
    return "free";
  }
  return plan;
}

/**
 * Counts the user's current usage for the given resource.
 *   - landings: total count owned by the user (per-account allowance)
 *   - banners:  count generated within the last 30 days (rolling window)
 */
export async function getCurrentUsage(
  supabase: SupabaseClient,
  userId: string,
  resource: Resource,
): Promise<number> {
  if (resource === "landings") {
    const { count, error } = await supabase
      .from("landings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) {
      console.error("[planLimits] landings count error:", error);
      return 0;
    }
    return count ?? 0;
  }

  // banners — rolling 30-day window
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("banners")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) {
    console.error("[planLimits] banners count error:", error);
    return 0;
  }
  return count ?? 0;
}

export interface LimitCheckResult {
  allowed: boolean;
  plan: PlanId;
  limit: number | null; // null = unlimited
  current: number;
}

/**
 * Checks whether the user can create one more of the given resource.
 * Uses the DB-derived plan (NEVER trust client input).
 */
export async function checkLimit(
  supabase: SupabaseClient,
  userId: string,
  resource: Resource,
): Promise<LimitCheckResult> {
  const plan = await getUserPlan(supabase, userId);
  const limit = PLAN_LIMITS[resource][plan];
  const current = await getCurrentUsage(supabase, userId, resource);
  const allowed = limit === null ? true : current < limit;
  return { allowed, plan, limit, current };
}

/**
 * Builds the standard 403 JSON response used across all AI Edge Functions
 * when a plan limit is exceeded.
 */
export function planLimitResponse(
  result: LimitCheckResult,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({
      error: "plan_limit_reached",
      resource: undefined, // caller can override via wrapper if desired
      plan: result.plan,
      limit: result.limit,
      current: result.current,
      upgrade_url: "/pricing",
    }),
    {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}