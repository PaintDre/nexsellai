import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  Globe,
  Users as UsersIcon,
  Clock,
  AlertTriangle,
  Search,
} from "lucide-react";

interface FreeUser {
  user_id: string;
  full_name: string | null;
  email: string;
  normalized_email: string | null;
  email_domain: string | null;
  country_code: string | null;
  created_at: string;
  age_hours: number;
  in_free_window: boolean;
  free_window_remaining_minutes: number;
  credits_balance: number;
  landings_used: number;
  banners_used: number;
  used_free_dropi_generation: boolean;
}

interface DomainStat {
  domain: string;
  count: number;
}

interface SuspiciousGroup {
  normalized_email: string;
  variants: { raw_email: string; user_id: string; created_at: string }[];
}

interface AuditPayload {
  users: FreeUser[];
  totals: {
    free_users: number;
    in_free_window: number;
    used_free_dropi: number;
    unique_domains: number;
    suspicious_groups: number;
  };
  top_domains: DomainStat[];
  suspicious_groups: SuspiciousGroup[];
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("es-CL", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const AdminFreeUsers = () => {
  const [data, setData] = useState<AuditPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

  const fetchAudit = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const headers = {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    };
    try {
      const res = await fetch(`${baseUrl}/free-users-audit`, { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as AuditPayload;
      setData(json);
    } catch (err) {
      toast.error("Error cargando auditoría", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  const filteredUsers = data.users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.normalized_email?.toLowerCase().includes(q) ||
      u.email_domain?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-in p-4 md:p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" />
            Admin · Auditoría
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Usuarios Free & Anti-abuso
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitorea usuarios del plan gratuito, periodo de bienvenida activo y patrones
            sospechosos de duplicación de cuentas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
          </Button>
          <Button onClick={fetchAudit} size="sm" variant="secondary">
            Recargar
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={UsersIcon} label="Usuarios Free" value={data.totals.free_users} />
        <KpiCard
          icon={Sparkles}
          label="En periodo gratis (2h)"
          value={data.totals.in_free_window}
          accent
        />
        <KpiCard
          icon={Clock}
          label="Usaron generación gratis"
          value={data.totals.used_free_dropi}
        />
        <KpiCard icon={Globe} label="Dominios únicos" value={data.totals.unique_domains} />
        <KpiCard
          icon={AlertTriangle}
          label="Grupos sospechosos"
          value={data.totals.suspicious_groups}
          danger={data.totals.suspicious_groups > 0}
        />
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuarios Free</TabsTrigger>
          <TabsTrigger value="domains">Dominios</TabsTrigger>
          <TabsTrigger value="suspicious">
            Sospechosos
            {data.suspicious_groups.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                {data.suspicious_groups.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB: Free users */}
        <TabsContent value="users" className="space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, dominio o nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Dominio</TableHead>
                      <TableHead>Registrado</TableHead>
                      <TableHead>Estado gratis</TableHead>
                      <TableHead className="text-right">Uso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-sm text-muted-foreground py-8"
                        >
                          Sin resultados
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredUsers.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">
                          {u.full_name || "—"}
                          {u.country_code && (
                            <span className="ml-2 text-[10px] uppercase text-muted-foreground">
                              {u.country_code}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs break-all">
                          <div>{u.email}</div>
                          {u.normalized_email && u.normalized_email !== u.email.toLowerCase() && (
                            <div className="text-[10px] text-muted-foreground/70 italic">
                              norm: {u.normalized_email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {u.email_domain || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(u.created_at)}
                          <div className="text-[10px]">hace {u.age_hours}h</div>
                        </TableCell>
                        <TableCell>
                          {u.in_free_window ? (
                            <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Activo · {u.free_window_remaining_minutes}m
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Expirado
                            </Badge>
                          )}
                          {u.used_free_dropi_generation && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              ✓ Usó gen. gratis
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          <div>L: {u.landings_used} · B: {u.banners_used}</div>
                          <div className="text-muted-foreground">
                            {u.credits_balance} créditos
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Domain stats */}
        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 15 dominios por registros</CardTitle>
              <CardDescription>
                Si un dominio aparece muchas veces, podría indicar uso masivo desde un proveedor
                concreto. Considera bloquearlo si es desechable.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dominio</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_domains.map((d) => (
                    <TableRow key={d.domain}>
                      <TableCell className="font-mono text-sm">{d.domain}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={d.count > 5 ? "default" : "secondary"}>
                          {d.count}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Suspicious */}
        <TabsContent value="suspicious">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Patrones de duplicación detectados
              </CardTitle>
              <CardDescription>
                Estas cuentas comparten el mismo email normalizado (alias <code>+xxx</code> o
                puntos en Gmail). El trigger ya bloquea futuros intentos, pero estos registros
                históricos pueden requerir revisión manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.suspicious_groups.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  ✅ Sin grupos sospechosos. Todos los usuarios tienen emails únicos.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email normalizado</TableHead>
                      <TableHead>Variantes</TableHead>
                      <TableHead className="text-right">Cuentas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.suspicious_groups.map((g) => (
                      <TableRow key={g.normalized_email}>
                        <TableCell className="font-mono text-xs">
                          {g.normalized_email}
                        </TableCell>
                        <TableCell className="text-xs space-y-1">
                          {g.variants.map((v) => (
                            <div key={v.user_id} className="flex items-center gap-2">
                              <span className="font-mono">{v.raw_email}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDate(v.created_at)}
                              </span>
                            </div>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">{g.variants.length}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent?: boolean;
  danger?: boolean;
}

const KpiCard = ({ icon: Icon, label, value, accent, danger }: KpiCardProps) => (
  <Card
    className={
      danger
        ? "border-destructive/40 bg-destructive/5"
        : accent
          ? "border-primary/30 bg-primary/5"
          : ""
    }
  >
    <CardContent className="p-4 space-y-1">
      <div
        className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold ${
          danger
            ? "text-destructive"
            : accent
              ? "text-primary"
              : "text-muted-foreground"
        }`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-2xl font-bold font-display">{value}</div>
    </CardContent>
  </Card>
);

export default AdminFreeUsers;
