import { Sparkles, Zap, Shield } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const features = [
  { icon: Sparkles, label: "Landings generadas con IA en minutos" },
  { icon: Zap, label: "Banners profesionales para tus productos" },
  { icon: Shield, label: "Exporta, publica y vende sin límites" },
];

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen">
      {/* Branding panel */}
      <div className="hidden md:flex md:w-[44%] lg:w-[40%] flex-col justify-between bg-sidebar p-10 lg:p-14 text-sidebar-primary-foreground">
        <div>
          <div className="flex items-center gap-2.5 mb-14">
            <div className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo-ns.png" alt="Nexsell" className="h-9 w-9 object-contain" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight">Nexsell</span>
          </div>

          <h2 className="text-3xl lg:text-[2.5rem] font-bold font-display leading-[1.15] mb-4">
            Crea landings que<br />venden para tus productos
          </h2>
          <p className="text-sidebar-foreground text-sm lg:text-base mb-12 leading-relaxed max-w-md">
            La plataforma de dropshippers que genera páginas de venta profesionales con inteligencia artificial.
          </p>

          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent">
                  <f.icon className="h-4 w-4 text-sidebar-primary" />
                </div>
                <span className="text-sm text-sidebar-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-sidebar-foreground/40 mt-8">
          © {new Date().getFullYear()} Nexsell. Todos los derechos reservados.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 bg-background">
        {/* Mobile branding */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg overflow-hidden">
            <img src="/logo-ns.png" alt="Nexsell" className="h-8 w-8 object-contain" />
          </div>
          <span className="text-xl font-bold font-display tracking-tight text-foreground">Nexsell</span>
        </div>

        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h1 className="text-xl font-bold font-display text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
