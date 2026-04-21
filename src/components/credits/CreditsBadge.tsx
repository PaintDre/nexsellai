import { Link } from "react-router-dom";
import { Coins } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";

interface Props { collapsed?: boolean; }

export const CreditsBadge = ({ collapsed = false }: Props) => {
  const { balance, allowance, loading } = useCredits();
  if (loading) return null;
  const ratio = allowance > 0 ? balance / allowance : 0;
  const tone = ratio <= 0.1 ? "text-destructive" : ratio <= 0.25 ? "text-warning" : "text-primary";
  const barTone = ratio <= 0.1 ? "bg-destructive" : ratio <= 0.25 ? "bg-warning" : "bg-primary";

  if (collapsed) {
    return (
      <Link to="/pricing" aria-label={`${balance} credits`}
        className={cn("flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border/40 bg-sidebar-accent/40 hover:bg-sidebar-accent transition-colors", tone)}>
        <Coins className="h-4 w-4" />
      </Link>
    );
  }
  return (
    <Link to="/pricing" className="flex items-center gap-2 rounded-lg border border-sidebar-border/40 bg-sidebar-accent/40 px-2.5 py-1.5 hover:bg-sidebar-accent transition-colors">
      <Coins className={cn("h-3.5 w-3.5 shrink-0", tone)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className={cn("text-xs font-bold tabular-nums", tone)}>{balance}</span>
          <span className="text-[10px] text-sidebar-foreground/50 tabular-nums">/ {allowance}</span>
        </div>
        <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-sidebar-border/40">
          <div className={cn("h-full transition-all", barTone)} style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }} />
        </div>
      </div>
    </Link>
  );
};
