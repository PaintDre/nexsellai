import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar, SidebarContent } from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PageBreadcrumb } from "./PageBreadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

const planLabels: Record<string, string> = { free: "Free", starter: "Starter", pro: "Pro" };

export const AppLayout = () => {
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden overflow-x-hidden">
      {/* Desktop sidebar */}
      {!isMobile && !isTablet && <AppSidebar />}

      {/* Tablet collapsed sidebar */}
      {isTablet && <AppSidebar collapsed />}

      {/* Mobile sheet */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
            <VisuallyHidden>
              <SheetTitle>Menú de navegación</SheetTitle>
            </VisuallyHidden>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-1 flex-col overflow-hidden max-w-full">
        {/* Mobile header */}
        {isMobile && (
          <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
            <Button variant="ghost" size="icon" className="text-sidebar-foreground" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
                <img src="/logo-ns.png" alt="Nexsell" className="h-8 w-8 object-contain" />
              </div>
              <span className="text-lg font-bold font-display tracking-tight text-sidebar-primary-foreground">Nexsell</span>
            </div>
          </header>
        )}

        {/* Desktop/Tablet header with breadcrumbs */}
        {!isMobile && (
          <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-6">
            <PageBreadcrumb />
            {profile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                  {profile.full_name || "Usuario"}
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                  {planLabels[profile.plan] || "Free"}
                </Badge>
              </div>
            )}
          </header>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
