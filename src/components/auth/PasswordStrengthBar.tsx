import { cn } from "@/lib/utils";

interface PasswordStrengthBarProps {
  password: string;
}

function getStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Débil", "Media", "Fuerte"];
  return { score, label: labels[score - 1] || "" };
}

const colors = [
  "bg-destructive",
  "bg-[hsl(var(--warning))]",
  "bg-[hsl(var(--success))]",
];

const PasswordStrengthBar = ({ password }: PasswordStrengthBarProps) => {
  const { score, label } = getStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i < score ? colors[score - 1] : "bg-muted",
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-xs font-medium transition-colors",
          score === 1 && "text-destructive",
          score === 2 && "text-[hsl(var(--warning))]",
          score === 3 && "text-[hsl(var(--success))]",
        )}
      >
        {label}
      </p>
    </div>
  );
};

export default PasswordStrengthBar;
