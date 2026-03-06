import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      setSent(true);
    }
  };

  return (
    <AuthLayout title="Recuperar contraseña" subtitle="Te enviaremos un enlace para restablecer tu contraseña">
      {sent ? (
        <div className="text-center space-y-5 py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">¡Correo enviado!</h3>
            <p className="text-sm text-muted-foreground">
              Si existe una cuenta con <span className="font-medium text-foreground">{email}</span>, recibirás un enlace para restablecer tu contraseña.
            </p>
          </div>
          <Button variant="outline" className="w-full h-12" asChild>
            <Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" />Volver a iniciar sesión</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required className="h-12 pl-10 transition-all duration-200" />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar enlace de recuperación"}
          </Button>
          <div className="text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />Volver a iniciar sesión
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
