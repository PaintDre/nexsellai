const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Computes how many banners the user has effectively used in the current
 * 30-day window. Returns 0 if the window has expired or no profile is provided.
 */
export function computeBannersUsed(
  profile: {
    banners_reset_at?: string | null;
    banners_used?: number | null;
  } | null,
): number {
  if (!profile) return 0;
  const resetAt = profile.banners_reset_at
    ? new Date(profile.banners_reset_at)
    : null;
  if (!resetAt || Date.now() - resetAt.getTime() >= THIRTY_DAYS_MS) {
    return 0;
  }
  return profile.banners_used || 0;
}
