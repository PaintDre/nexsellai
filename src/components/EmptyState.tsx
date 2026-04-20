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
  className?: string;
}

/**
 * Elegant, brand-consistent empty state.
 * - Aurora gradient background (subtle primary glow)
 * - Floating icon in a glass medallion
 * - Optional CTA (link or button)
 * Use everywhere: Banners, Landings, Dropi, Dashboard.
 */
const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => {
  const ActionIcon = action?.icon;

  return (
    <Card className={cn("border-dashed border-border/60 bg-aurora overflow-hidden", className)}>
      <CardContent className="flex flex-col items-center justify-center text-center px-5 py-12 sm:py-16">
        {/* Icon medallion */}
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" aria-hidden />
          <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl glass-card">
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

        {action && (
          <div className="mt-6">
            {action.to ? (
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
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
