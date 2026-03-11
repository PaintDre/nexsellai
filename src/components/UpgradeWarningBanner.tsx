import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface Props {
  resource: string;
  used: number;
  limit: number;
}

export const UpgradeWarningBanner = ({ resource, used, limit }: Props) => {
  const ratio = limit > 0 ? used / limit : 0;
  if (ratio < 0.8 || ratio >= 1) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
      <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
      <p className="flex-1 text-foreground">
        Estás cerca de tu límite de <strong>{resource}</strong> ({used}/{limit}).{" "}
        <Link to="/pricing" className="text-primary font-medium hover:underline">
          Actualiza tu plan
        </Link>{" "}
        para seguir creando.
      </p>
    </div>
  );
};
