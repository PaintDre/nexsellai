import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, FileText, CreditCard, Settings, LogOut, Zap, Shield, ShieldCheck, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-warning/20 text-warning",
  pro: "bg-primary/20 text-primary",
};

export const AppSidebar = () => {
  const { pathname } = useLocation();
  const { profile, signOut, role, isAdmin, isSuperAdmin } = useAuth();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Productos", icon: Package, href: "/products" },
    { label: "Landings", icon: FileText, href: "/landings" },
    { label: "Banners", icon: ImageIcon, href: "/banners" },
    { label: "Planes", icon: CreditCard, href: "/pricing" },
  ];

  if (isAdmin()) {
    navItems.push({ label: "Admin", icon: Shield, href: "/admin" });
  }
  if (isSuperAdmin()) {
    navItems.push({ label: "Sistema", icon: ShieldCheck, href: "/admin/config" });
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Zap className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-xl font-bold font-display tracking-tight text-sidebar-primary-foreground">Nexsell</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4 space-y-3">
        {profile && (
          <div className="flex items-center gap-2">
            <div className={cn("rounded-md px-2 py-0.5 text-xs font-semibold uppercase", planColors[profile.plan] || planColors.free)}>
              {profile.plan}
            </div>
            <span className="text-xs text-sidebar-foreground truncate">{profile.full_name || "Usuario"}</span>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2 text-sidebar-foreground" asChild>
            <Link to="/settings"><Settings className="h-4 w-4" /> Ajustes</Link>
          </Button>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-destructive shrink-0" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};
