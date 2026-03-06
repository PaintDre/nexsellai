import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Lock, Trash2, ExternalLink, HelpCircle, MessageSquare, Zap, Image } from "lucide-react";
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

const PLAN_LIMITS: Record<string, number> = { free: 1, starter: 10, pro: 100 };
const BANNER_LIMITS: Record<string, number> = { free: 2, starter: 30, pro: 150 };

const SettingsPage = () => {
  const { user, profile, refreshProfile, isAdmin } = useAuth();
  

  // Account
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Generator preferences
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
  const limit = PLAN_LIMITS[plan] || 1;
  const usagePercent = Math.min((landingsUsed / limit) * 100, 100);

  const bannerLimit = BANNER_LIMITS[plan] || 2;
  const bannerResetAt = profile?.banners_reset_at ? new Date(profile.banners_reset_at) : null;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const bannersUsed = (!bannerResetAt || (Date.now() - bannerResetAt.getTime()) >= thirtyDaysMs) ? 0 : (profile?.banners_used || 0);
  const bannerUsagePercent = Math.min((bannersUsed / bannerLimit) * 100, 100);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold font-display tracking-tight">Ajustes</h1>

      {/* A) Account */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Cuenta</CardTitle>
          <CardDescription>Tu información personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving || fullName === (profile?.full_name || "")} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando..." : "Guardar nombre"}
          </Button>

          <div className="border-t pt-4 space-y-2">
            <Label htmlFor="newPassword">Cambiar contraseña</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="newPassword"
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline" className="w-full sm:w-auto shrink-0">
                <Lock className="h-4 w-4 mr-2" /> {changingPassword ? "Cambiando..." : "Cambiar"}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar cuenta
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

      {/* B) Plan & Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Plan y uso
          </CardTitle>
          <CardDescription>Tu plan actual y consumo de landings y banners</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan actual</span>
            <span className="font-semibold capitalize">{plan}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Landings usadas</span>
              <span className="font-medium">{landingsUsed} / {limit}</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1"><Image className="h-3.5 w-3.5" /> Banners usados</span>
              <span className="font-medium">{bannersUsed} / {bannerLimit}</span>
            </div>
            <Progress value={bannerUsagePercent} className="h-2" />
          </div>
          {plan !== "pro" && (
            <Button asChild variant="outline" className="w-full">
              <Link to="/pricing">Mejorar plan</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* C) Generator Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Preferencias del generador</CardTitle>
          <CardDescription>Valores predeterminados al crear nuevas landings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Intensidad por defecto</Label>
            <Select value={defaultIntensity} onValueChange={setDefaultIntensity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">Suave</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="hard">Intensa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Framework por defecto</Label>
            <Select value={defaultMode} onValueChange={setDefaultMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aida">AIDA</SelectItem>
                <SelectItem value="standard">Estándar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSavePreferences} variant="outline" className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" /> Guardar preferencias
          </Button>
        </CardContent>
      </Card>

      {/* D) Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <HelpCircle className="h-5 w-5" /> Ayuda y soporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <a href="mailto:soporte@nexsell.ai" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="h-4 w-4" /> Reportar un problema
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
