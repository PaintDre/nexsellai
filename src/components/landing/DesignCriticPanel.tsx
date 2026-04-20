import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  axis: "hierarchy" | "contrast" | "spacing" | "conversion";
  severity: "low" | "medium" | "high";
  title: string;
  fix: string;
}

interface Critique {
  score: number;
  axes: { hierarchy: number; contrast: number; spacing: number; conversion: number };
  summary: string;
  wins: string[];
  suggestions: Suggestion[];
}

interface DesignCriticPanelProps {
  blocks: any[];
  theme?: string;
  product?: { name?: string; price?: number; category?: string } | null;
}

const axisLabels: Record<string, string> = {
  hierarchy: "Jerarquía",
  contrast: "Contraste",
  spacing: "Espaciado",
  conversion: "Conversión",
};

const severityStyles: Record<string, string> = {
  high: "border-destructive/40 bg-destructive/5 text-destructive",
  medium: "border-warning/40 bg-warning/5 text-warning",
  low: "border-info/40 bg-info/5 text-info",
};

const scoreColor = (s: number) =>
  s >= 85 ? "text-emerald-600" : s >= 70 ? "text-amber-600" : "text-destructive";

const scoreRing = (s: number) =>
  s >= 85 ? "stroke-emerald-500" : s >= 70 ? "stroke-amber-500" : "stroke-destructive";

const DesignCriticPanel = ({ blocks, theme, product }: DesignCriticPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [critique, setCritique] = useState<Critique | null>(null);
  const [open, setOpen] = useState(false);

  const run = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke("design-critic", {
        body: { blocks, theme, product },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCritique(data as Critique);
    } catch (e: any) {
      toast.error("No se pudo evaluar la landing", { description: e?.message });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open && !critique) {
    return (
      <Button onClick={run} disabled={loading} variant="outline" size="sm" className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        AI Design Critic
      </Button>
    );
  }

  // Score arc
  const r = 36;
  const c = 2 * Math.PI * r;
  const pct = critique?.score ?? 0;
  const offset = c - (pct / 100) * c;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">AI Design Critic</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={run} disabled={loading} className="h-7 text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Re-evaluar"}
          </Button>
          <button
            onClick={() => {
              setOpen(false);
              setCritique(null);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && !critique && (
        <div className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Analizando jerarquía, contraste, espaciado y conversión…</p>
        </div>
      )}

      {critique && (
        <div className="p-4 space-y-4">
          {/* Score + axes */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0" style={{ width: 88, height: 88 }}>
              <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                <circle cx="44" cy="44" r={r} className="stroke-muted" strokeWidth="8" fill="none" />
                <circle
                  cx="44"
                  cy="44"
                  r={r}
                  className={scoreRing(pct)}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={c}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 800ms ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${scoreColor(pct)}`}>{pct}</span>
                <span className="text-[10px] text-muted-foreground -mt-1">/ 100</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{critique.summary}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                {Object.entries(critique.axes).map(([axis, val]) => (
                  <div key={axis} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{axisLabels[axis]}</span>
                    <span className={`font-semibold ${scoreColor(val)}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wins */}
          {critique.wins?.length > 0 && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Lo que está bien
              </div>
              {critique.wins.map((w, i) => (
                <p key={i} className="text-xs text-foreground/80 leading-relaxed">• {w}</p>
              ))}
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Mejoras accionables ({critique.suggestions.length})
            </div>
            {critique.suggestions.map((s, i) => (
              <div key={i} className={`rounded-lg border p-3 ${severityStyles[s.severity]}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{s.title}</span>
                      <span className="text-[10px] uppercase tracking-wide opacity-70">
                        {axisLabels[s.axis]}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{s.fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignCriticPanel;
