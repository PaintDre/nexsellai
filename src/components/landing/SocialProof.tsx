import { type LandingTheme } from "./themes";

interface SocialProofProps {
  theme: LandingTheme;
}

const SocialProof = ({ theme }: SocialProofProps) => {
  // Generate a deterministic "random" number for social proof
  const viewCount = 147;

  const textColor = theme === "bold" ? "text-gray-400" : "text-muted-foreground";
  const dotColor = theme === "bold" ? "bg-emerald-400" : "bg-emerald-500";

  return (
    <div className={`flex items-center gap-2 text-sm ${textColor}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${dotColor} animate-pulse`} />
      <span>🔥 <strong>{viewCount}</strong> personas vieron este producto hoy</span>
    </div>
  );
};

export default SocialProof;
