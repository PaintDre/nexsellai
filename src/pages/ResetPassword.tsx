import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrengthBar from "@/components/auth/PasswordStrengthBar";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setReady(true);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("auth.resetPassword.mismatch"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("auth.resetPassword.minLength"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(t("common.error"), { description: error.message });
    } else {
      toast.success(t("auth.resetPassword.success"), { description: t("auth.resetPassword.successDesc") });
      navigate("/login");
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("auth.resetPassword.verifying")}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout title={t("auth.resetPassword.title")} subtitle={t("auth.resetPassword.subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.resetPassword.newPassword")}</Label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.resetPassword.placeholder")} required minLength={6} />
          <PasswordStrengthBar password={password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("auth.resetPassword.confirmPassword")}</Label>
          <div className="relative">
            <PasswordInput id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("auth.resetPassword.confirmPlaceholder")} required minLength={6} />
            {(passwordsMatch || passwordsMismatch) && (
              <span className="absolute right-10 top-1/2 -translate-y-1/2">
                {passwordsMatch ? <Check className="h-4 w-4 text-[hsl(var(--success))]" /> : <X className="h-4 w-4 text-destructive" />}
              </span>
            )}
          </div>
          {passwordsMismatch && (
            <p className="text-xs text-destructive">{t("auth.resetPassword.mismatch")}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.resetPassword.submit")}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
