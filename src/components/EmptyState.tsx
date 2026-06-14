import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    to?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    to?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

/**
 * Elegant, brand-consistent empty state.
 * - Aurora gradient background (subtle primary glow)
 * - Animated decorative SVG (concentric rings) behind a glass medallion
 * - Optional primary + secondary CTAs (link or button)
 * Use everywhere: Banners, Landings, Dropi, Dashboard.
 */
const EmptyState = ({ icon: Icon, title, description, action, secondaryAction, className }: EmptyStateProps) => {
  const ActionIcon = action?.icon;
  const SecondaryActionIcon = secondaryAction?.icon;

  return (
    <Card className={cn("relative border-dashed border-border/60 bg-aurora overflow-hidden", className)}>
      {/* Decorative concentric rings */}
      <svg
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 opacity-[0.18] text-primary"
        width="280" height="280" viewBox="0 0 280 280" fill="none"
      >
        <circle cx="140" cy="140" r="40" stroke="currentColor" strokeWidth="1" />
        <circle cx="140" cy="140" r="70" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="140" cy="140" r="100" stroke="currentColor" strokeWidth="1" strokeDasharray="2 8" />
        <circle cx="140" cy="140" r="130" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1 10" />
      </svg>

      <CardContent className="relative flex flex-col items-center justify-center text-center px-5 py-12 sm:py-16">
        {/* Icon medallion */}
        <div className="relative mb-5">
          <div className="absolute -inset-2 rounded-full bg-primary/15 blur-2xl animate-pulse-soft" aria-hidden />
          <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl glass-card shadow-md border border-primary/15">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" strokeWidth={1.75} />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold font-display tracking-tight text-foreground max-w-[28ch]">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-[44ch] leading-relaxed">
            {description}
          </p>
        )}

        {(action || secondaryAction) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {action && (
              action.to ? (
                <Button asChild size="sm" className="press-on-active">
                  <Link to={action.to}>
                    {ActionIcon && <ActionIcon className="h-3.5 w-3.5 mr-1.5" />}
                    {action.label}
                  </Link>
                </Button>
              ) : (
                <Button size="sm" onClick={action.onClick} className="press-on-active">
                  {ActionIcon && <ActionIcon className="h-3.5 w-3.5 mr-1.5" />}
                  {action.label}
                </Button>
              )
            )}
            {secondaryAction && (
              secondaryAction.to ? (
                <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Link to={secondaryAction.to}>
                    {SecondaryActionIcon && <SecondaryActionIcon className="h-3.5 w-3.5 mr-1.5" />}
                    {secondaryAction.label}
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={secondaryAction.onClick} className="text-muted-foreground hover:text-foreground">
                  {SecondaryActionIcon && <SecondaryActionIcon className="h-3.5 w-3.5 mr-1.5" />}
                  {secondaryAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
