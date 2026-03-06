import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  showIcon?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showIcon = true, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        {showIcon && (
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(
            "flex h-12 w-full rounded-md border border-input bg-background pr-11 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            showIcon ? "pl-10" : "px-3",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
