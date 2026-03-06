import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Users, Ban, ArrowLeft, Save, Loader2 } from "lucide-react";

interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string;
  plan: string;
  roles: string[];
  landings_used: number;
  created_at: string;
}

interface PendingChanges {
  [userId: string]: { plan?: string; role?: string };
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  const isMobile = useIsMobile();

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    };
  };

  const fetchUsers = async () => {
    const headers = await getHeaders();
    const res = await fetch(`${baseUrl}/users`, { headers });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    } else {
      toast({ title: "Error al cargar usuarios", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const setLocalPlan = (userId: string, plan: string, originalPlan: string) => {
    setPendingChanges((prev) => {
      const existing = prev[userId] || {};
      const updated = { ...existing, plan };
      // If same as original, remove that key
      if (updated.plan === originalPlan) delete updated.plan;
      if (!updated.plan && !updated.role) {
        const { [userId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [userId]: updated };
    });
  };

  const setLocalRole = (userId: string, role: string, originalRole: string) => {
    setPendingChanges((prev) => {
      const existing = prev[userId] || {};
      const updated = { ...existing, role };
      if (updated.role === originalRole) delete updated.role;
      if (!updated.plan && !updated.role) {
        const { [userId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [userId]: updated };
    });
  };

  const saveAllChanges = async () => {
    setSaving(true);
    const headers = await getHeaders();
    const errors: string[] = [];

    for (const [userId, changes] of Object.entries(pendingChanges)) {
      if (changes.plan) {
        try {
          const res = await fetch(`${baseUrl}/users/${userId}/plan`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ plan: changes.plan }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            errors.push(body.error || `Error updating plan for ${userId}`);
          }
        } catch (e) {
          errors.push(`Network error updating plan: ${(e as Error).message}`);
        }
      }
      if (changes.role) {
        try {
          const res = await fetch(`${baseUrl}/users/${userId}/role`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ role: changes.role }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            errors.push(body.error || `Error updating role for ${userId}`);
          }
        } catch (e) {
          errors.push(`Network error updating role: ${(e as Error).message}`);
        }
      }
    }

    if (errors.length > 0) {
      toast({ title: "Error al guardar", description: errors.join("; "), variant: "destructive" });
    } else {
      toast({ title: "Cambios guardados correctamente" });
    }

    setPendingChanges({});
    await fetchUsers();
    setSaving(false);
  };

  const deactivateUser = async (userId: string) => {
    const headers = await getHeaders();
    const res = await fetch(`${baseUrl}/users/${userId}/deactivate`, {
      method: "PATCH",
      headers,
    });
    if (res.ok) {
      toast({ title: "Usuario desactivado" });
      fetchUsers();
    } else {
      toast({ title: "Error al desactivar", variant: "destructive" });
    }
  };

  const getDisplayPlan = (u: UserRow) => pendingChanges[u.user_id]?.plan || u.plan;
  const getDisplayRole = (u: UserRow) => pendingChanges[u.user_id]?.role || u.roles[0] || "user";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 sm:h-7 sm:w-7" /> Gestión de Usuarios
            </h1>
            <p className="text-muted-foreground mt-1">{users.length} usuarios registrados</p>
          </div>
        </div>
        <Button
          onClick={saveAllChanges}
          disabled={!hasPendingChanges || saving}
          className="gap-2 w-full sm:w-auto"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>

      {hasPendingChanges && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
          Tienes cambios sin guardar en {Object.keys(pendingChanges).length} usuario(s).
        </div>
      )}

      {isMobile ? (
        /* Mobile: Card-based layout */
        <div className="space-y-3">
          {users.map((u) => {
            const hasChange = !!pendingChanges[u.user_id];
            return (
              <Card key={u.user_id} className={hasChange ? "border-primary/30 bg-primary/5" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{u.full_name || "—"}</p>
                      <p className="text-sm text-muted-foreground break-all">{u.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0 min-h-[44px]" onClick={() => deactivateUser(u.user_id)}>
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Plan</p>
                      <Select value={getDisplayPlan(u)} onValueChange={(v) => setLocalPlan(u.user_id, v, u.plan)}>
                        <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Rol</p>
                      {isSuperAdmin() ? (
                         <Select value={getDisplayRole(u)} onValueChange={(v) => setLocalRole(u.user_id, v, u.roles[0] || "user")}>
                          <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary" className="capitalize mt-1">{u.roles[0] || "user"}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Landings: <strong className="text-foreground">{u.landings_used}</strong></span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Desktop: Table layout */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Nombre</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Plan</th>
                    <th className="text-left p-3">Rol</th>
                    <th className="text-right p-3">Landings</th>
                    <th className="text-right p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const hasChange = !!pendingChanges[u.user_id];
                    return (
                      <tr key={u.user_id} className={`border-b last:border-0 hover:bg-muted/30 ${hasChange ? "bg-primary/5" : ""}`}>
                        <td className="p-3">{u.full_name || "—"}</td>
                        <td className="p-3 text-muted-foreground">{u.email}</td>
                        <td className="p-3">
                          <Select value={getDisplayPlan(u)} onValueChange={(v) => setLocalPlan(u.user_id, v, u.plan)}>
                            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="starter">Starter</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          {isSuperAdmin() ? (
                            <Select value={getDisplayRole(u)} onValueChange={(v) => setLocalRole(u.user_id, v, u.roles[0] || "user")}>
                              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary" className="capitalize">{u.roles[0] || "user"}</Badge>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium">{u.landings_used}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deactivateUser(u.user_id)}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminUsers;
