export type UserPlan = "free" | "starter" | "pro";

export const FREE_PLAN_LANDING_LIMIT = 1;

export const DEFAULT_CREDIT_COSTS = {
  banner_single: 5,
  banner_aida_pack: 30,
  landing_text: 10,
} as const;

export const DEFAULT_CREDIT_ALLOWANCES: Record<UserPlan, number> = {
  free: 30,
  starter: 300,
  pro: 1500,
};

export function canCreateLanding(plan: UserPlan, existingLandings: number) {
  if (plan !== "free") return true;
  return existingLandings < FREE_PLAN_LANDING_LIMIT;
}

export function getBannerGenerationCost(sequenceLength: number, costs = DEFAULT_CREDIT_COSTS) {
  if (sequenceLength <= 0) return 0;
  return sequenceLength >= 5 ? costs.banner_aida_pack : costs.banner_single * sequenceLength;
}

export function canGenerateBanners(creditsBalance: number, sequenceLength: number, costs = DEFAULT_CREDIT_COSTS) {
  return creditsBalance >= getBannerGenerationCost(sequenceLength, costs);
}

export function shouldGrantMonthlyCredits(input: {
  creditsResetAt: string | null;
  creditsPlanSnapshot: string | null;
  currentPlan: UserPlan;
  now?: Date;
  force?: boolean;
}) {
  if (input.force) return true;
  if (!input.creditsResetAt) return true;
  if ((input.creditsPlanSnapshot ?? "") !== input.currentPlan) return true;

  const now = input.now ?? new Date();
  const resetAt = new Date(input.creditsResetAt);
  return resetAt.getTime() < now.getTime() - 30 * 24 * 60 * 60 * 1000;
}

export function getMonthlyGrantBalance(plan: UserPlan, allowances = DEFAULT_CREDIT_ALLOWANCES) {
  return allowances[plan] ?? allowances.free;
}