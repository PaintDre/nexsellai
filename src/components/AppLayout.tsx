import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageBreadcrumb } from "./PageBreadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";

const planLabels: Record<string, string> = { free: "Free", starter: "Starter", pro: "Pro" };

export const AppLayout = () => {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex h-screen w-full overflow-hidden overflow-x-hidden">
      {/* Desktop/Tablet: hover-expand sidebar */}
      {!isMobile && <AppSidebar />}

      <div className="flex flex-1 flex-col overflow-hidden max-w-full">
        {/* Mobile header */}
        {isMobile && (
          <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-4">
            <div className="flex items-center gap-2">
              <Logo size={26} className="rounded-lg" />
              <span className="text-base font-bold font-display tracking-tight">Nexsell</span>
            </div>
            {profile && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {profile.full_name || t("appLayout.user")}
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
                  {profile.full_name || t("appLayout.user")}
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-wide">
                  {planLabels[profile.plan] || "Free"}
                </Badge>
              </div>
            )}
          </header>
        )}

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden bg-background"
          // Reserve space for the mobile bottom nav (56px bar + safe-area)
          style={isMobile ? { paddingBottom: "calc(56px + env(safe-area-inset-bottom))" } : undefined}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile-only bottom navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};
