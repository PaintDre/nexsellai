import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Users, Ban, ArrowLeft } from "lucide-react";

interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string;
  plan: string;
  roles: string[];
  landings_used: number;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

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

  const changePlan = async (userId: string, plan: string) => {
    const headers = await getHeaders();
    const res = await fetch(`${baseUrl}/users/${userId}/plan`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ plan }),
    });
    if (res.ok) {
      toast({ title: "Plan actualizado" });
      fetchUsers();
    } else {
      toast({ title: "Error al cambiar plan", variant: "destructive" });
    }
  };

  const changeRole = async (userId: string, role: string) => {
    const headers = await getHeaders();
    const res = await fetch(`${baseUrl}/users/${userId}/role`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast({ title: "Rol actualizado" });
      fetchUsers();
    } else {
      toast({ title: "Error al cambiar rol", variant: "destructive" });
    }
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-2">
            <Users className="h-7 w-7" /> Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground mt-1">{users.length} usuarios registrados</p>
        </div>
      </div>

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
                {users.map((u) => (
                  <tr key={u.user_id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">{u.full_name || "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <Select
                        key={`plan-${u.user_id}-${u.plan}`}
                        defaultValue={u.plan}
                        onValueChange={(v) => changePlan(u.user_id, v)}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      {isSuperAdmin() ? (
                        <Select
                          key={`role-${u.user_id}-${u.roles[0]}`}
                          defaultValue={u.roles[0] || "user"}
                          onValueChange={(v) => changeRole(u.user_id, v)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
