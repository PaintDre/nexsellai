import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  resource: string;
  used: number;
  limit: number;
}

export const UpgradeWarningBanner = ({ resource, used, limit }: Props) => {
  const { t } = useTranslation();
  const ratio = limit > 0 ? used / limit : 0;
  if (ratio < 0.8 || ratio >= 1) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
      <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
      <p className="flex-1 text-foreground">
        {t("upgrade.warningSimple", { resource, used, limit })}{" "}
        <Link to="/pricing" className="text-primary font-medium hover:underline">
          {t("upgrade.upgradePlan")}
        </Link>{" "}
        {t("upgrade.keepCreating")}
      </p>
    </div>
  );
};
