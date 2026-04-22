import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useIsNewUser } from "@/hooks/useIsNewUser";

interface FreeBadgeProps {
  /** If true, render even when the user is no longer "new". Default false. */
  forceShow?: boolean;
  /** Visual size variant. */
  size?: "xs" | "sm" | "md";
  /** Optional override label key (defaults to "common.freeBadge"). */
  labelKey?: string;
  className?: string;
}

/**
 * Small attention-grabbing pill that highlights a free action for newly
 * registered users. Auto-hides after NEW_USER_FREE_BADGE_HOURS unless forceShow.
 */
export const FreeBadge = ({
  forceShow = false,
  size = "sm",
  labelKey = "common.freeBadge",
  className,
}: FreeBadgeProps) => {
  const { t } = useTranslation();
  const isNew = useIsNewUser();
  if (!forceShow && !isNew) return null;

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0.5 gap-0.5",
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1",
  }[size];

  const iconSize = size === "xs" ? 9 : size === "sm" ? 11 : 13;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold uppercase tracking-wide",
        "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
        "shadow-sm shadow-primary/30 ring-1 ring-primary/20",
        sizeClasses,
        className,
      )}
    >
      <Sparkles size={iconSize} className="shrink-0" />
      {t(labelKey, "GRATIS")}
    </span>
  );
};
