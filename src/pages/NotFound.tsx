import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <Logo size={64} className="rounded-2xl" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold font-display tracking-tight text-foreground">404</h1>
          <p className="text-xl text-muted-foreground">{t("notFound.title")}</p>
          <p className="text-sm text-muted-foreground">{t("notFound.description")}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="default" className="min-h-[44px] w-full sm:w-auto">
            <Link to="/dashboard"><Home className="h-4 w-4 mr-2" /> {t("common.goToDashboard")}</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-[44px] w-full sm:w-auto">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> {t("common.goToHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
