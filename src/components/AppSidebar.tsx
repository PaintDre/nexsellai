import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Shield,
  ShieldCheck,
  ImageIcon,
  Banknote,
  Mail,
  RefreshCw,
  Zap,
  Video,
  BadgeCheck,
  Pin,
  PinOff,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreditsBadge } from "@/components/credits/CreditsBadge";

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-warning/15 text-warning",
  pro: "bg-primary/15 text-primary",
};

const PIN_STORAGE_KEY = "nexsell_sidebar_pinned";

interface SidebarContentProps {
  expanded?: boolean;
  onNavigate?: () => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}

type NavItem = { label: string; icon: any; href: string };

export const SidebarContent = ({
  expanded = false,
  onNavigate,
  pinned,
  onTogglePin,
}: SidebarContentProps) => {
  const { pathname } = useLocation();
  const { profile, signOut, isAdmin, isSuperAdmin } = useAuth();
  const { t } = useTranslation();

  // Grouped navigation for clearer information architecture
  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: t("sidebar.groupMain"),
      items: [
        { label: t("sidebar.dashboard"), icon: LayoutDashboard, href: "/dashboard" },
        { label: t("sidebar.products"), icon: Package, href: "/products" },
      ],
    },
    {
      label: t("sidebar.groupCreate"),
      items: [
        { label: t("sidebar.landings"), icon: FileText, href: "/landings" },
        { label: t("sidebar.banners"), icon: ImageIcon, href: "/banners" },
        { label: "Dropi", icon: Package, href: "/dropi" },
      ],
    },
    {
      label: t("sidebar.groupAccount"),
      items: [
        { label: t("sidebar.plans"), icon: CreditCard, href: "/pricing" },
        { label: t("sidebar.subscription"), icon: BadgeCheck, href: "/subscription" },
      ],
    },
  ];

  const adminItems: NavItem[] = [];
  if (isAdmin()) {
    adminItems.push({ label: t("sidebar.admin"), icon: Shield, href: "/admin" });
    adminItems.push({ label: "Free & Anti-abuso", icon: ShieldAlert, href: "/admin/free-users" });
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

  const collapsed = !expanded;

  const renderNavLink = (item: NavItem) => {
    const active = pathname.startsWith(item.href);
    const link = (
      <Link
        to={item.href}
        onClick={onNavigate}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors min-h-[40px]",
          collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2",
          active
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
      >
        <item.icon
          className={cn("h-[18px] w-[18px] shrink-0", active && "text-sidebar-primary")}
        />
        {expanded && <span className="whitespace-nowrap truncate">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href} delayDuration={150}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return <div key={item.href}>{link}</div>;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo + Pin */}
      <div
        className={cn(
          "flex items-center py-5 shrink-0",
          collapsed ? "justify-center px-2" : "px-4 justify-between",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Logo size={28} className="rounded-lg shrink-0" />
          {expanded && (
            <span className="text-base font-bold font-display tracking-tight text-sidebar-accent-foreground truncate">
              Nexsell
            </span>
          )}
        </div>
        {expanded && onTogglePin && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={onTogglePin}
                aria-label={pinned ? t("sidebar.unpin") : t("sidebar.pin")}
                className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors shrink-0"
              >
                {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {pinned ? t("sidebar.unpin") : t("sidebar.pin")}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-2",
          collapsed ? "px-2 space-y-1" : "px-3 space-y-4",
        )}
      >
        {groups.map((group, gi) => (
          <div key={group.label} className={cn(collapsed ? "space-y-1" : "space-y-0.5")}>
            {expanded && (
              <p className="px-2.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold mb-1">
                {group.label}
              </p>
            )}
            {group.items.map(renderNavLink)}
            {collapsed && gi < groups.length - 1 && (
              <div className="h-px bg-sidebar-border/30 mx-2 my-1" />
            )}
          </div>
        ))}

        {adminItems.length > 0 && (
          <div
            className={cn(
              collapsed
                ? "space-y-1 pt-1 border-t border-sidebar-border/30 mt-2"
                : "space-y-0.5 pt-3 border-t border-sidebar-border/40 mt-2",
            )}
          >
            {expanded && (
              <p className="px-2.5 pt-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold mb-1">
                Admin
              </p>
            )}
            {adminItems.map(renderNavLink)}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "border-t border-sidebar-border/40 p-3 space-y-3 shrink-0",
          collapsed && "px-2",
        )}
      >
        {/* Credits balance — links to /pricing */}
        <CreditsBadge collapsed={collapsed} />
        {profile && expanded && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                planColors[profile.plan] || planColors.free,
              )}
            >
              {profile.plan}
            </div>
            <span className="text-xs text-sidebar-foreground/70 truncate whitespace-nowrap">
              {profile.full_name || t("sidebar.user")}
            </span>
          </div>
        )}
        {/* Social links */}
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center gap-1" : "gap-2",
          )}
        >
          <a
            href="https://instagram.com/nexsellai"
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors"
            title="Instagram"
            aria-label="Instagram"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
          <a
            href="https://x.com/nexsellai"
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors"
            title="X (Twitter)"
            aria-label="X (Twitter)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://discord.gg/qg5AYq3BE"
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors"
            title="Discord"
            aria-label="Discord"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>
        </div>
        <div className={cn("flex", collapsed ? "flex-col items-center gap-1.5" : "gap-1.5")}>
          <ThemeToggle collapsed={collapsed} />
          {expanded ? (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start gap-2 text-sidebar-foreground text-xs h-8"
              asChild
              onClick={onNavigate}
            >
              <Link to="/settings">
                <Settings className="h-3.5 w-3.5" /> {t("sidebar.settings")}
              </Link>
            </Button>
          ) : (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground h-8 w-8"
                  asChild
                  onClick={onNavigate}
                >
                  <Link to="/settings" aria-label={t("sidebar.settings")}>
                    <Settings className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {t("sidebar.settings")}
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("sidebar.logout")}
                className="text-sidebar-foreground hover:text-destructive shrink-0 h-8 w-8"
                onClick={signOut}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? "right" : "top"} className="text-xs">
              {t("sidebar.logout")}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export const AppSidebar = () => {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);

  // Restore pin preference
  useEffect(() => {
    try {
      setPinned(localStorage.getItem(PIN_STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const togglePin = () => {
    setPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PIN_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const expanded = pinned || hovered;

  return (
    <>
      {/* Layout spacer — reserves 240px when pinned, otherwise 56px (mini) */}
      <div
        className={cn(
          "hidden md:block shrink-0 transition-[width] duration-200",
          pinned ? "w-60" : "w-14",
        )}
      />

      {/* Actual sidebar — fixed; expands on hover as overlay unless pinned */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Main navigation"
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen flex-col bg-sidebar text-sidebar-foreground z-50",
          "transition-[width] duration-200 ease-out overflow-hidden border-r",
          expanded
            ? "w-60 shadow-2xl shadow-black/20 border-sidebar-border/30"
            : "w-14 border-sidebar-border/50",
        )}
      >
        <SidebarContent
          expanded={expanded}
          pinned={pinned}
          onTogglePin={togglePin}
        />
      </aside>
    </>
  );
};
