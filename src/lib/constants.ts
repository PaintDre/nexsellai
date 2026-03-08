/** Plan-based landing generation limits (per billing cycle). */
export const LANDING_LIMITS: Record<string, number> = {
  free: 1,
  starter: 10,
  pro: 100,
};

/** Plan-based banner generation limits (per 30-day window). */
export const BANNER_LIMITS: Record<string, number> = {
  free: 2,
  starter: 30,
  pro: 150,
};

/** Product categories used across forms. */
export const PRODUCT_CATEGORIES = [
  { value: "home", label: "Hogar" },
  { value: "fitness", label: "Fitness" },
  { value: "beauty", label: "Belleza" },
  { value: "gadget", label: "Gadgets" },
  { value: "pets", label: "Mascotas" },
] as const;
