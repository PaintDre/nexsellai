import { useAuth } from "@/hooks/useAuth";

// Window during which a freshly registered user sees "FREE" highlight badges
// across the app. After this period the badges disappear automatically.
export const NEW_USER_FREE_BADGE_HOURS = 2;

/**
 * Returns true if the current user registered less than NEW_USER_FREE_BADGE_HOURS ago.
 * Used to show contextual "GRATIS" tags on free actions (downloads, first AI ad, etc.)
 * to drive activation in the very first session, then fade out organically.
 */
export const useIsNewUser = (): boolean => {
  const { profile } = useAuth();
  if (!profile?.created_at) return false;
  const createdAt = new Date(profile.created_at).getTime();
  const ageMs = Date.now() - createdAt;
  return ageMs < NEW_USER_FREE_BADGE_HOURS * 60 * 60 * 1000;
};
