import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MailCheck, Mail, User, Loader2, Check, X, Globe } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrengthBar from "@/components/auth/PasswordStrengthBar";
import { COUNTRIES, detectCountryFromTimezone, getBrowserTimezone, getCountryByCode } from "@/lib/countries";
import { useTranslation } from "react-i18next";

const Register = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const detected = detectCountryFromTimezone();
    if (detected) setCountryCode(detected.code);
  }, []);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t("auth.register.passwordsMismatch"), { description: t("auth.register.passwordsMismatchDesc") });
      return;
    }

    setLoading(true);
    const selectedCountry = getCountryByCode(countryCode);
    const timezone = getBrowserTimezone();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          country_code: countryCode || null,
          timezone,
          currency: selectedCountry?.currency || "USD",
        },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    setLoading(false);
    if (error) {
      const raw = (error.message || "").toLowerCase();
      let description = error.message;
      if (raw.includes("disposable_email_blocked")) {
        description = t(
          "auth.register.errorDisposable",
          "Por favor usa un correo personal válido. Los correos temporales no están permitidos.",
        );
      } else if (raw.includes("duplicate_account_blocked")) {
        description = t(
          "auth.register.errorDuplicate",
          "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.",
        );
      }
      toast.error(t("auth.register.errorTitle"), { description });
    } else {
      setRegisteredEmail(email);
      setShowVerificationDialog(true);
    }
  };

  return (
    <AuthLayout title={t("auth.register.title")} subtitle={t("auth.register.subtitle")}>
      <Helmet>
        <title>Crear cuenta gratis | Nexsell</title>
        <meta name="description" content="Regístrate gratis en Nexsell y empieza a generar landing pages y banners IA optimizados para tu ecommerce en minutos." />
        <link rel="canonical" href="https://nexsellai.com/register" />
        <meta property="og:title" content="Crear cuenta gratis | Nexsell" />
        <meta property="og:description" content="Regístrate gratis en Nexsell y empieza a generar landing pages y banners IA optimizados para tu ecommerce en minutos." />
        <meta property="og:url" content="https://nexsellai.com/register" />
        <meta name="twitter:title" content="Crear cuenta gratis | Nexsell" />
        <meta name="twitter:description" content="Regístrate gratis en Nexsell y empieza a generar landing pages y banners IA optimizados para tu ecommerce en minutos." />
      </Helmet>
      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">{t("auth.register.fullName")}</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("auth.register.fullNamePlaceholder")} required className="h-12 pl-10 transition-all duration-200" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">{t("auth.register.country")}</Label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="h-12 pl-10">
                <SelectValue placeholder={t("auth.register.countryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name} ({c.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.register.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.register.emailPlaceholder")} required className="h-12 pl-10 transition-all duration-200" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.register.password")}</Label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.register.passwordPlaceholder")} minLength={6} required />
          <PasswordStrengthBar password={password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("auth.register.confirmPassword")}</Label>
          <div className="relative">
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("auth.register.confirmPasswordPlaceholder")}
              minLength={6}
              required
            />
            {(passwordsMatch || passwordsMismatch) && (
              <span className="absolute right-10 top-1/2 -translate-y-1/2">
                {passwordsMatch ? <Check className="h-4 w-4 text-[hsl(var(--success))]" /> : <X className="h-4 w-4 text-destructive" />}
              </span>
            )}
          </div>
          {passwordsMismatch && (
            <p className="text-xs text-destructive">{t("auth.register.passwordsMismatch")}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.register.submit")}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t("auth.register.orContinueWith")}</span>
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
              toast.error(t("auth.register.googleError"), { description: String(error) });
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
          {t("auth.register.hasAccount")}{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">{t("auth.register.signIn")}</Link>
        </p>
      </form>

      <Dialog open={showVerificationDialog} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="items-center text-center space-y-4 pt-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-10 w-10 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold font-display">
              {t("auth.register.verification.title")}
            </DialogTitle>
            <DialogDescription className="text-base space-y-3">
              <p>
                {t("auth.register.verification.sentTo")}{" "}
                <span className="font-semibold text-foreground">{registeredEmail}</span>
              </p>
              <p>
                {t("auth.register.verification.checkSpam")}
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4 pb-2">
            <Button size="lg" className="w-full text-base" onClick={() => navigate("/login")}>
              {t("auth.register.verification.understood")}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t("auth.register.verification.expiry")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
};

export default Register;
