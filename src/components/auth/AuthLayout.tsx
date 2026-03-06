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
      {/* Branding panel — hidden on mobile */}
      <div className="hidden md:flex md:w-[45%] lg:w-[42%] flex-col justify-between bg-gradient-to-br from-[hsl(152,60%,20%)] to-[hsl(var(--sidebar-background))] p-10 lg:p-14 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <img src="/logo-ns.png" alt="Nexsell" className="h-9 w-9 object-contain" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight">Nexsell</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold font-display leading-tight mb-4">
            Crea landings que venden para tus productos
          </h2>
          <p className="text-white/70 text-base lg:text-lg mb-10 leading-relaxed">
            La plataforma de dropshippers que genera páginas de venta profesionales con inteligencia artificial.
          </p>

          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                </div>
                <span className="text-sm lg:text-base text-white/90">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/40 mt-8">
          © {new Date().getFullYear()} Nexsell. Todos los derechos reservados.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 bg-background">
        {/* Mobile branding */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl overflow-hidden">
            <img src="/logo-ns.png" alt="Nexsell" className="h-9 w-9 object-contain" />
          </div>
          <span className="text-2xl font-bold font-display tracking-tight text-foreground">Nexsell</span>
        </div>

        <div className="w-full max-w-[420px] space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
