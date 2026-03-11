import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Lock, Trash2, HelpCircle, MessageSquare, Zap, Image, Palette, Sun, Moon, Monitor, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LANDING_LIMITS, BANNER_LIMITS } from "@/lib/constants";
import { computeBannersUsed } from "@/lib/planUsage";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const { user, profile, refreshProfile, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [defaultIntensity, setDefaultIntensity] = useState(() => localStorage.getItem("pref_intensity") || "medium");
  const [defaultMode, setDefaultMode] = useState(() => localStorage.getItem("pref_mode") || "aida");

  useEffect(() => {
    if (profile) setFullName(profile.full_name || "");
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      toast.success("Perfil actualizado");
      await refreshProfile();
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      toast.success("Contraseña actualizada");
      setNewPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    toast("Contacta soporte para eliminar tu cuenta", { description: "Por seguridad, la eliminación de cuenta requiere verificación manual." });
  };

  const handleSavePreferences = () => {
    localStorage.setItem("pref_intensity", defaultIntensity);
    localStorage.setItem("pref_mode", defaultMode);
    toast.success("Preferencias guardadas");
  };

  const plan = profile?.plan || "free";
  const landingsUsed = profile?.landings_used || 0;
  const limit = LANDING_LIMITS[plan] || 1;
  const usagePercent = Math.min((landingsUsed / limit) * 100, 100);

  const bannerLimit = BANNER_LIMITS[plan] || 2;
  const bannersUsed = computeBannersUsed(profile);
  const bannerUsagePercent = Math.min((bannersUsed / bannerLimit) * 100, 100);

  const themeOptions = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ];

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold font-display">Ajustes</h1>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Cuenta</CardTitle>
          <CardDescription>Tu información personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Nombre</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving || fullName === (profile?.full_name || "")} size="sm" className="w-full sm:w-auto">
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Guardando..." : "Guardar nombre"}
          </Button>

          <div className="border-t pt-4 space-y-2">
            <Label htmlFor="newPassword" className="text-xs">Cambiar contraseña</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="newPassword"
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                <Lock className="h-3.5 w-3.5 mr-1.5" /> {changingPassword ? "Cambiando..." : "Cambiar"}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Eliminar cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción es irreversible. Todos tus datos, productos y landings serán eliminados permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> Apariencia
          </CardTitle>
          <CardDescription>Personaliza el tema de la interfaz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all duration-200",
                  theme === opt.value
                    ? "border-primary bg-accent"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
              >
                <opt.icon className={cn("h-4 w-4", theme === opt.value ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan & Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Plan y uso
          </CardTitle>
          <CardDescription>Tu plan actual y consumo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Plan actual</span>
            <span className="font-medium text-sm capitalize">{plan}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span>Landings usadas</span>
              <span className="font-medium">{landingsUsed} / {limit}</span>
            </div>
            <Progress value={usagePercent} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1"><Image className="h-3 w-3" /> Banners usados</span>
              <span className="font-medium">{bannersUsed} / {bannerLimit}</span>
            </div>
            <Progress value={bannerUsagePercent} className="h-1.5" />
          </div>
          {plan !== "pro" && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/pricing">Mejorar plan</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {isAdmin() && (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Preferencias del generador</CardTitle>
          <CardDescription>Valores predeterminados al crear nuevas landings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Intensidad por defecto</Label>
            <Select value={defaultIntensity} onValueChange={setDefaultIntensity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">Suave</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="hard">Intensa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Framework por defecto</Label>
            <Select value={defaultMode} onValueChange={setDefaultMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aida">AIDA</SelectItem>
                <SelectItem value="standard">Estándar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSavePreferences} variant="outline" size="sm" className="w-full sm:w-auto">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar preferencias
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> Ayuda y soporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <a href="mailto:soporte@nexsell.ai" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="h-3.5 w-3.5" /> Reportar un problema
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
