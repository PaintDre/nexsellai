import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import { useTranslation } from "react-i18next";

const REMEMBER_KEY = "nexsell_remembered_email";

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(t("auth.login.errorTitle"), { description: error.message });
    } else {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      if (authData.user) {
        const { count } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("user_id", authData.user.id);

        if (count === 0) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    }
  };

  return (
    <AuthLayout title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.login.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.login.emailPlaceholder")}
              required
              className="h-12 pl-10 transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.login.passwordPlaceholder")}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} />
          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">{t("auth.login.rememberEmail")}</Label>
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.login.submit")}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t("auth.login.orContinueWith")}</span>
          <Separator className="flex-1" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 gap-2 text-base"
          onClick={async () => {
            const { error } = await lovable.auth.signInWithOAuth("google", {
              redirect_uri: window.location.origin,
            });
            if (error) {
              toast.error(t("auth.login.googleError"), { description: String(error) });
            }
          }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          {t("auth.login.noAccount")}{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">{t("auth.login.registerFree")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
