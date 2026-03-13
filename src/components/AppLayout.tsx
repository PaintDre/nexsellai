import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar, SidebarContent } from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PageBreadcrumb } from "./PageBreadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const planLabels: Record<string, string> = { free: "Free", starter: "Starter", pro: "Pro" };

export const AppLayout = () => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex h-screen w-full overflow-hidden overflow-x-hidden">
      {/* Desktop/Tablet: hover-expand sidebar */}
      {!isMobile && <AppSidebar />}

      {/* Mobile sheet */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-60 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
            <VisuallyHidden>
              <SheetTitle>Menú de navegación</SheetTitle>
            </VisuallyHidden>
            <SidebarContent expanded onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-1 flex-col overflow-hidden max-w-full">
        {/* Mobile header */}
        {isMobile && (
          <header className="sticky top-0 z-40 flex h-13 items-center justify-between border-b border-border/40 bg-background/60 backdrop-blur-xl px-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-foreground h-9 w-9" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden">
                <img src="/logo-ns.png" alt="Nexsell" className="h-7 w-7 object-contain" />
              </div>
              <span className="text-base font-bold font-display tracking-tight">Nexsell</span>
            </div>
            {profile && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {profile.full_name || "Usuario"}
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-wide">
                  {planLabels[profile.plan] || "Free"}
                </Badge>
              </div>
            )}
          </header>
        )}

        {/* Desktop/Tablet header with glassmorphism */}
        {!isMobile && (
          <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border/30 bg-background/60 backdrop-blur-xl px-6">
            <PageBreadcrumb />
            {profile && (
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {profile.full_name || "Usuario"}
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-wide">
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
