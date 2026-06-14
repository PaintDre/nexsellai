import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FileText,
  ImageIcon,
  MoreHorizontal,
  CreditCard,
  BadgeCheck,
  Settings,
  LogOut,
  Shield,
  ShieldCheck,
  Banknote,
  Mail,
  Zap,
  Video,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CreditsBadge } from "@/components/credits/CreditsBadge";

type NavItem = { label: string; icon: any; href: string };

/**
 * Mobile-only bottom navigation bar.
 * Shows the 4 most important destinations + a "More" sheet with the rest.
 */
export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { signOut, isAdmin, isSuperAdmin } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  // Primary actions visible in the bar (touch-optimized: 5 tappable areas).
  const primary: NavItem[] = [
    { label: t("sidebar.dashboard"), icon: LayoutDashboard, href: "/dashboard" },
    { label: t("sidebar.products"), icon: Package, href: "/products" },
    { label: t("sidebar.banners"), icon: ImageIcon, href: "/banners" },
    { label: "Dropi", icon: Package, href: "/dropi" },
  ];

  // Secondary items live in the "More" sheet.
  const secondary: NavItem[] = [
    { label: t("sidebar.landings"), icon: FileText, href: "/landings" },
    { label: t("sidebar.plans"), icon: CreditCard, href: "/pricing" },
    { label: t("sidebar.subscription"), icon: BadgeCheck, href: "/subscription" },
    { label: t("sidebar.settings"), icon: Settings, href: "/settings" },
  ];

  const adminItems: NavItem[] = [];
  if (isAdmin()) {
    adminItems.push({ label: t("sidebar.admin"), icon: Shield, href: "/admin" });
    adminItems.push({ label: t("sidebar.payments"), icon: Banknote, href: "/admin/payments" });
    adminItems.push({ label: t("sidebar.email"), icon: Mail, href: "/admin/email" });
    adminItems.push({ label: t("sidebar.automations"), icon: Zap, href: "/admin/automations" });
    adminItems.push({ label: "Dropi Catalog", icon: Package, href: "/admin/dropi" });
    adminItems.push({ label: "Dropi Videos", icon: Video, href: "/admin/dropi/videos" });
    adminItems.push({ label: t("sidebar.subscriptions"), icon: RefreshCw, href: "/admin/subscriptions" });
  }
  if (isSuperAdmin()) {
    adminItems.push({ label: t("sidebar.system"), icon: ShieldCheck, href: "/admin/config" });
  }

  const isActive = (href: string) => pathname.startsWith(href);
  const moreActive =
    secondary.some((i) => isActive(i.href)) || adminItems.some((i) => isActive(i.href));

  return (
    <>
      <nav
        aria-label={t("appLayout.navMenu")}
        className={cn(
          "fixed bottom-0 inset-x-0 z-40 md:hidden",
          "bg-background/95 backdrop-blur-xl border-t border-border/60",
          "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <div className="flex items-stretch justify-around h-14">
          {primary.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 transition-colors",
                  "active:scale-95 active:bg-muted/40",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className={cn("text-[10px] font-medium truncate max-w-[64px]", active && "font-semibold")}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" />
                )}
              </Link>
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            aria-label={t("sidebar.more")}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 transition-colors",
              "active:scale-95 active:bg-muted/40",
              moreActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className={cn("text-[10px] font-medium", moreActive && "font-semibold")}>
              {t("sidebar.more")}
            </span>
          </button>
        </div>
      </nav>

      {/* "More" sheet — secondary + admin */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader className="px-5 py-4 border-b border-border/40">
            <SheetTitle className="text-left text-base font-display">
              {t("sidebar.more")}
            </SheetTitle>
          </SheetHeader>

          <div className="px-4 pt-3">
            <CreditsBadge />
          </div>

          <div className="p-3 space-y-1">
            {secondary.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[48px] transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/60",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {adminItems.length > 0 && (
            <div className="px-3 pb-3 space-y-1">
              <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Admin
              </p>
              {adminItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[48px] transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/60",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="border-t border-border/40 p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[48px]"
              onClick={() => {
                setMoreOpen(false);
                signOut();
              }}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">{t("sidebar.logout")}</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
