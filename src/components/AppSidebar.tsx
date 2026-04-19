import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, FileText, CreditCard, Settings, LogOut, Shield, ShieldCheck, ImageIcon, Banknote, Mail, RefreshCw, Zap, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-warning/15 text-warning",
  pro: "bg-primary/15 text-primary",
};

interface SidebarContentProps {
  expanded?: boolean;
  onNavigate?: () => void;
}

export const SidebarContent = ({ expanded = false, onNavigate }: SidebarContentProps) => {
  const { pathname } = useLocation();
  const { profile, signOut, role, isAdmin, isSuperAdmin } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { label: t("sidebar.dashboard"), icon: LayoutDashboard, href: "/dashboard" },
    { label: t("sidebar.products"), icon: Package, href: "/products" },
    { label: t("sidebar.landings"), icon: FileText, href: "/landings" },
    { label: t("sidebar.banners"), icon: ImageIcon, href: "/banners" },
    { label: "DROPI", icon: Package, href: "/dropi" },
    { label: t("sidebar.plans"), icon: CreditCard, href: "/pricing" },
  ];

  const adminItems: typeof navItems = [];
  if (isAdmin()) {
    adminItems.push({ label: t("sidebar.admin"), icon: Shield, href: "/admin" });
    adminItems.push({ label: t("sidebar.payments"), icon: Banknote, href: "/admin/payments" });
    adminItems.push({ label: t("sidebar.email"), icon: Mail, href: "/admin/email" });
    adminItems.push({ label: t("sidebar.automations"), icon: Zap, href: "/admin/automations" });
    adminItems.push({ label: "DROPI Catalog", icon: Package, href: "/admin/dropi" });
    adminItems.push({ label: "DROPI Videos", icon: Video, href: "/admin/dropi/videos" });
    adminItems.push({ label: t("sidebar.subscriptions"), icon: RefreshCw, href: "/admin/subscriptions" });
  }
  if (isSuperAdmin()) {
    adminItems.push({ label: t("sidebar.system"), icon: ShieldCheck, href: "/admin/config" });
  }

  const collapsed = !expanded;

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 py-6", collapsed ? "justify-center px-2" : "px-5")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 overflow-hidden">
          <img src="/logo-ns.png" alt="Nexsell" className="h-8 w-8 object-contain" />
        </div>
        {expanded && (
          <span className="text-lg font-bold font-display tracking-tight text-sidebar-primary-foreground whitespace-nowrap">
            Nexsell
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-0.5 py-2", collapsed ? "px-2" : "px-3")}>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg py-2 text-[13px] font-medium transition-all duration-300 ease-out",
                collapsed ? "justify-center px-2" : "px-3",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active && "text-sidebar-primary")} />
              {expanded && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}

        {adminItems.length > 0 && (
          <>
            <div className={cn("my-3 border-t border-sidebar-border/50", collapsed ? "mx-1" : "mx-2")} />
            {expanded && <p className="px-3 text-[10px] uppercase tracking-widest text-sidebar-foreground/40 mb-1 font-medium">Admin</p>}
            {adminItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg py-2 text-[13px] font-medium transition-all duration-300 ease-out",
                    collapsed ? "justify-center px-2" : "px-3",
                    active
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-sidebar-primary")} />
                  {expanded && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-sidebar-border/40 p-4 space-y-3", collapsed && "px-2")}>
        {profile && expanded && (
          <div className="flex items-center gap-2">
            <div className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", planColors[profile.plan] || planColors.free)}>
              {profile.plan}
            </div>
            <span className="text-xs text-sidebar-foreground/70 truncate whitespace-nowrap">{profile.full_name || t("sidebar.user")}</span>
          </div>
        )}
        {/* Social links */}
        <div className={cn("flex items-center", collapsed ? "justify-center gap-1" : "gap-2")}>
          <a href="https://instagram.com/nexsellai" target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors" title="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="https://x.com/nexsellai" target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors" title="X (Twitter)">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://discord.gg/qg5AYq3BE" target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors" title="Discord">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </a>
        </div>
        <div className={cn("flex", collapsed ? "flex-col items-center gap-1.5" : "gap-1.5")}>
          <ThemeToggle collapsed={collapsed} />
          {expanded ? (
            <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2 text-sidebar-foreground text-xs h-8" asChild onClick={onNavigate}>
              <Link to="/settings"><Settings className="h-3.5 w-3.5" /> {t("sidebar.settings")}</Link>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="text-sidebar-foreground h-8 w-8" asChild onClick={onNavigate}>
              <Link to="/settings" title={t("sidebar.settings")}><Settings className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-destructive shrink-0 h-8 w-8" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const AppSidebar = () => {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {/* Collapsed spacer — always takes up 60px in the layout flow */}
      <div className="hidden md:block w-[60px] shrink-0" />

      {/* Actual sidebar — fixed, expands on hover as overlay */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen flex-col bg-sidebar text-sidebar-foreground z-50",
          "transition-all duration-300 ease-out overflow-hidden",
          hovered
            ? "w-60 shadow-2xl shadow-black/20 border-r border-sidebar-border/30"
            : "w-[60px] border-r border-sidebar-border/50"
        )}
      >
        <SidebarContent expanded={hovered} />
      </aside>
    </>
  );
};
