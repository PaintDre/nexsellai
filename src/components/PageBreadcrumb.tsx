import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation } from "react-i18next";

const ROUTE_KEYS = [
  "dashboard", "products", "landings", "banners", "pricing",
  "settings", "admin", "new", "edit", "generate", "banner", "preview", "config",
];

export const PageBreadcrumb = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; path: string }[] = [];
  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    currentPath += `/${seg}`;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(seg);
    if (isUuid) continue;

    const label = ROUTE_KEYS.includes(seg)
      ? t(`breadcrumb.${seg}`)
      : seg.charAt(0).toUpperCase() + seg.slice(1);
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
