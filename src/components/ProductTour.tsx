import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Sparkles, ImageIcon, Rocket, ArrowRight, ArrowLeft, X } from "lucide-react";
import { useTranslation } from "react-i18next";

type Step = {
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descKey: string;
  ctaKey: string;
  to?: string;
};

const STEPS: Step[] = [
  { icon: Package, titleKey: "tour.s1.title", descKey: "tour.s1.desc", ctaKey: "tour.next" },
  { icon: Sparkles, titleKey: "tour.s2.title", descKey: "tour.s2.desc", ctaKey: "tour.next" },
  { icon: ImageIcon, titleKey: "tour.s3.title", descKey: "tour.s3.desc", ctaKey: "tour.next" },
  { icon: Rocket, titleKey: "tour.s4.title", descKey: "tour.s4.desc", ctaKey: "tour.start", to: "/products/new" },
];

const storageKey = (uid?: string) => `nexsell:tour:done:${uid || "anon"}`;

export default function ProductTour({ forceOpen = false, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setOpen(true);
      return;
    }
    if (!user) return;
    const done = localStorage.getItem(storageKey(user.id));
    if (done) return;
    // Only auto-show to brand-new users with no activity yet
    if (profile && !profile.full_name) return; // wait until onboarding name is set
    const t0 = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t0);
  }, [forceOpen, user, profile]);

  const finish = (navigateTo?: string) => {
    if (user) localStorage.setItem(storageKey(user.id), "1");
    setOpen(false);
    onClose?.();
    if (navigateTo) setTimeout(() => navigate(navigateTo), 120);
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) finish(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-primary/15">
        <div className="relative">
          <button
            onClick={() => finish()}
            className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
            aria-label={t("tour.skip")}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header art */}
          <div className="relative h-32 bg-gradient-to-br from-primary/15 via-primary/5 to-amber/10 flex items-center justify-center overflow-hidden">
            <div aria-hidden className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
            <div aria-hidden className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-amber/20 blur-2xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-md border border-primary/20">
              <Icon className="h-7 w-7 text-primary" />
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
              <span className="ml-auto text-[11px] font-medium text-muted-foreground tabular-nums">
                {step + 1} / {STEPS.length}
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold font-display tracking-tight">{t(current.titleKey)}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(current.descKey)}</p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {t("tour.back")}
              </Button>
              <div className="flex items-center gap-2">
                {!isLast && (
                  <Button variant="ghost" size="sm" onClick={() => finish()} className="text-muted-foreground">
                    {t("tour.skip")}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => (isLast ? finish(current.to) : setStep((s) => s + 1))}
                  className="shadow-sm"
                >
                  {t(current.ctaKey)} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}