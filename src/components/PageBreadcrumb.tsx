import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeMap: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Productos",
  landings: "Landings",
  banners: "Banners",
  pricing: "Planes",
  settings: "Ajustes",
  admin: "Admin",
  new: "Nuevo",
  edit: "Editar",
  generate: "Generar Landing",
  banner: "Generar Banner",
  preview: "Vista previa",
  config: "Configuración",
};

export const PageBreadcrumb = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; path: string }[] = [];
  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    currentPath += `/${seg}`;

    // Skip UUID segments as standalone crumbs but keep their path
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(seg);
    if (isUuid) continue;

    const label = routeMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
    crumbs.push({ label, path: currentPath });
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

