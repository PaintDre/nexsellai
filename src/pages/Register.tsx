import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MailCheck } from "lucide-react";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone || undefined },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error al registrarse", description: error.message, variant: "destructive" });
    } else {
      setRegisteredEmail(email);
      setShowVerificationDialog(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
              <img src="/logo-ns.png" alt="Nexsell" className="h-10 w-10 object-contain" />
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Nexsell</h1>
          </div>
          <p className="text-muted-foreground">Crea tu cuenta y empieza a vender</p>
        </div>

        <Card>
          <form onSubmit={handleRegister}>
            <CardHeader>
              <CardTitle className="font-display">Crear Cuenta</CardTitle>
              <CardDescription>Empieza con el plan Free — 1 landing gratis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 1234 5678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
                {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
              </Button>
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">Inicia sesión</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Modal de verificación de email */}
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
              ¡Revisa tu correo electrónico!
            </DialogTitle>
            <DialogDescription className="text-base space-y-3">
              <p>
                Hemos enviado un enlace de verificación a{" "}
                <span className="font-semibold text-foreground">{registeredEmail}</span>
              </p>
              <p>
                Haz clic en el enlace del correo para activar tu cuenta. Si no lo encuentras, revisa tu carpeta de <span className="font-medium">spam</span> o <span className="font-medium">correo no deseado</span>.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4 pb-2">
            <Button
              size="lg"
              className="w-full text-base"
              onClick={() => navigate("/login")}
            >
              Entendido, ir a iniciar sesión
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              El enlace expira en 24 horas. Si no recibiste el correo, podrás solicitar uno nuevo desde la página de inicio de sesión.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;
