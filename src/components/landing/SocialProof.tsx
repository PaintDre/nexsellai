import { useTranslation } from "react-i18next";
import { type LandingTheme } from "./themes";

interface SocialProofProps {
  theme: LandingTheme;
}

const SocialProof = ({ theme }: SocialProofProps) => {
  const { t } = useTranslation();
  const viewCount = 147;

  const textColor = theme === "bold" ? "text-gray-400" : "text-muted-foreground";
  const dotColor = theme === "bold" ? "bg-emerald-400" : "bg-emerald-500";

  return (
    <div className={`flex items-center gap-2 text-sm ${textColor}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${dotColor} animate-pulse`} />
      <span dangerouslySetInnerHTML={{ __html: t("socialProof.viewedToday", { count: viewCount }) }} />
    </div>
  );
};

export default SocialProof;
