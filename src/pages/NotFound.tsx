import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden">
            <img src="/logo-ns.png" alt="Nexsell" className="h-16 w-16 object-contain" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold font-display tracking-tight text-foreground">404</h1>
          <p className="text-xl text-muted-foreground">Página no encontrada</p>
          <p className="text-sm text-muted-foreground">
            La página que buscas no existe o fue movida.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="default" className="min-h-[44px] w-full sm:w-auto">
            <Link to="/dashboard">
              <Home className="h-4 w-4 mr-2" /> Ir al Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-[44px] w-full sm:w-auto">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
