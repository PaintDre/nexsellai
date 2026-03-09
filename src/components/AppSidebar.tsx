import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, FileText, CreditCard, Settings, LogOut, Shield, ShieldCheck, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-warning/15 text-warning",
  pro: "bg-primary/15 text-primary",
};

interface SidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export const SidebarContent = ({ collapsed = false, onNavigate }: SidebarContentProps) => {
  const { pathname } = useLocation();
  const { profile, signOut, role, isAdmin, isSuperAdmin } = useAuth();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Productos", icon: Package, href: "/products" },
    { label: "Landings", icon: FileText, href: "/landings" },
    { label: "Banners", icon: ImageIcon, href: "/banners" },
    { label: "Planes", icon: CreditCard, href: "/pricing" },
  ];

  const adminItems: typeof navItems = [];
  if (isAdmin()) {
    adminItems.push({ label: "Admin", icon: Shield, href: "/admin" });
  }
  if (isSuperAdmin()) {
    adminItems.push({ label: "Sistema", icon: ShieldCheck, href: "/admin/config" });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 py-6", collapsed ? "justify-center px-2" : "px-6")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 overflow-hidden">
          <img src="/logo-ns.png" alt="Nexsell" className="h-8 w-8 object-contain" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold font-display tracking-tight text-sidebar-primary-foreground">Nexsell</span>
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
                "flex items-center gap-3 rounded-lg py-2 text-[13px] font-medium transition-all duration-200",
                collapsed ? "justify-center px-2" : "px-3",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active && "text-sidebar-primary")} />
              {!collapsed && item.label}
            </Link>
          );
        })}

        {adminItems.length > 0 && (
          <>
            <div className={cn("my-3 border-t border-sidebar-border/50", collapsed ? "mx-1" : "mx-2")} />
            {!collapsed && <p className="px-3 text-[10px] uppercase tracking-widest text-sidebar-foreground/40 mb-1 font-medium">Admin</p>}
            {adminItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg py-2 text-[13px] font-medium transition-all duration-200",
                    collapsed ? "justify-center px-2" : "px-3",
                    active
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-sidebar-primary")} />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-sidebar-border/40 p-4 space-y-3", collapsed && "px-2")}>
        {profile && !collapsed && (
          <div className="flex items-center gap-2">
            <div className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", planColors[profile.plan] || planColors.free)}>
              {profile.plan}
            </div>
            <span className="text-xs text-sidebar-foreground/70 truncate">{profile.full_name || "Usuario"}</span>
          </div>
        )}
        <div className={cn("flex", collapsed ? "flex-col items-center gap-1.5" : "gap-1.5")}>
          <ThemeToggle collapsed={collapsed} />
          {!collapsed ? (
            <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2 text-sidebar-foreground text-xs h-8" asChild onClick={onNavigate}>
              <Link to="/settings"><Settings className="h-3.5 w-3.5" /> Ajustes</Link>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="text-sidebar-foreground h-8 w-8" asChild onClick={onNavigate}>
              <Link to="/settings" title="Ajustes"><Settings className="h-3.5 w-3.5" /></Link>
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

export const AppSidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  return (
    <aside className={cn(
      "hidden md:flex h-screen flex-col border-r border-sidebar-border/50 bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
      collapsed ? "w-[60px]" : "w-60"
    )}>
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
};
