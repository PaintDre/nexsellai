import { describe, expect, it } from "vitest";
import {
  canCreateLanding,
  canGenerateBanners,
  getBannerGenerationCost,
  getMonthlyGrantBalance,
  shouldGrantMonthlyCredits,
} from "./planRules";

describe("Plan Free rules", () => {
  it("allows a Free user to create only one landing total", () => {
    expect(canCreateLanding("free", 0)).toBe(true);
    expect(canCreateLanding("free", 1)).toBe(false);
    expect(canCreateLanding("free", 5)).toBe(false);
  });

  it("does not apply the one-landing total limit to paid plans", () => {
    expect(canCreateLanding("starter", 10)).toBe(true);
    expect(canCreateLanding("pro", 25)).toBe(true);
  });
});

describe("Banner credit consumption", () => {
  it("charges 5 credits per banner for sequences below pack size", () => {
    expect(getBannerGenerationCost(1)).toBe(5);
    expect(getBannerGenerationCost(3)).toBe(15);
    expect(canGenerateBanners(14, 3)).toBe(false);
    expect(canGenerateBanners(15, 3)).toBe(true);
  });

  it("charges the AIDA pack cost when generating 5 or more banners", () => {
    expect(getBannerGenerationCost(5)).toBe(30);
    expect(getBannerGenerationCost(7)).toBe(30);
    expect(canGenerateBanners(29, 5)).toBe(false);
    expect(canGenerateBanners(30, 5)).toBe(true);
  });
});

describe("Monthly credit reset rules", () => {
  const now = new Date("2026-04-23T12:00:00.000Z");

  it("grants credits when credits_reset_at is missing", () => {
    expect(
      shouldGrantMonthlyCredits({ creditsResetAt: null, creditsPlanSnapshot: null, currentPlan: "free", now }),
    ).toBe(true);
  });

  it("does not grant again before 30 days when plan is unchanged", () => {
    expect(
      shouldGrantMonthlyCredits({
        creditsResetAt: "2026-04-10T12:00:00.000Z",
        creditsPlanSnapshot: "free",
        currentPlan: "free",
        now,
      }),
    ).toBe(false);
  });

  it("grants again after 30 days or when the plan changed", () => {
    expect(
      shouldGrantMonthlyCredits({
        creditsResetAt: "2026-03-20T12:00:00.000Z",
        creditsPlanSnapshot: "free",
        currentPlan: "free",
        now,
      }),
    ).toBe(true);

    expect(
      shouldGrantMonthlyCredits({
        creditsResetAt: "2026-04-20T12:00:00.000Z",
        creditsPlanSnapshot: "free",
        currentPlan: "starter",
        now,
      }),
    ).toBe(true);
  });

  it("replaces balance with the current plan allowance on grant", () => {
    expect(getMonthlyGrantBalance("free")).toBe(30);
    expect(getMonthlyGrantBalance("starter")).toBe(300);
    expect(getMonthlyGrantBalance("pro")).toBe(1500);
  });
});