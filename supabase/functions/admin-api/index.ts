import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Authenticate caller
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

  // Check caller roles
  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (callerRoles || []).map((r: { role: string }) => r.role);
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isSuperAdmin = roles.includes("super_admin");

  if (!isAdmin) return jsonResponse({ error: "Forbidden" }, 403);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/admin-api/, "");

  try {
    // GET /users
    if (req.method === "GET" && path === "/users") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Get roles and emails for all users
      const userIds = (profiles || []).map((p: any) => p.user_id);
      const { data: allRoles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Get emails from auth
      const usersWithEmail = [];
      for (const profile of profiles || []) {
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.user_id);
        const userRoles = (allRoles || []).filter((r: any) => r.user_id === profile.user_id);
        usersWithEmail.push({
          ...profile,
          email: authUser?.email || "",
          roles: userRoles.map((r: any) => r.role),
        });
      }

      return jsonResponse({ users: usersWithEmail });
    }

    // PATCH /users/:id/plan
    if (req.method === "PATCH" && path.match(/^\/users\/[^/]+\/plan$/)) {
      const userId = path.split("/")[2];
      const { plan } = await req.json();
      if (!["free", "starter", "pro"].includes(plan)) {
        return jsonResponse({ error: "Invalid plan" }, 400);
      }
      const { error } = await supabase
        .from("profiles")
        .update({ plan })
        .eq("user_id", userId);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    // PATCH /users/:id/role
    if (req.method === "PATCH" && path.match(/^\/users\/[^/]+\/role$/)) {
      if (!isSuperAdmin) return jsonResponse({ error: "Forbidden: super_admin only" }, 403);
      const userId = path.split("/")[2];
      const { role } = await req.json();
      if (!["user", "admin", "super_admin"].includes(role)) {
        return jsonResponse({ error: "Invalid role" }, 400);
      }
      // Remove existing roles, add new one
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    // PATCH /users/:id/deactivate
    if (req.method === "PATCH" && path.match(/^\/users\/[^/]+\/deactivate$/)) {
      const userId = path.split("/")[2];
      const { data, error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: "876600h" });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    // GET /stats
    if (req.method === "GET" && path === "/stats") {
      const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: totalLandings } = await supabase.from("landings").select("*", { count: "exact", head: true });

      const { data: planStats } = await supabase.from("profiles").select("plan");
      const byPlan = { free: 0, starter: 0, pro: 0 };
      (planStats || []).forEach((p: any) => { byPlan[p.plan as keyof typeof byPlan] = (byPlan[p.plan as keyof typeof byPlan] || 0) + 1; });

      const { data: topUsers } = await supabase
        .from("profiles")
        .select("user_id, full_name, landings_used, plan")
        .order("landings_used", { ascending: false })
        .limit(10);

      return jsonResponse({ totalUsers, totalLandings, byPlan, topUsers });
    }

    // GET /config
    if (req.method === "GET" && path === "/config") {
      if (!isSuperAdmin) return jsonResponse({ error: "Forbidden" }, 403);
      const { data } = await supabase.from("system_config").select("*");
      return jsonResponse({ config: data || [] });
    }

    // PUT /config
    if (req.method === "PUT" && path === "/config") {
      if (!isSuperAdmin) return jsonResponse({ error: "Forbidden" }, 403);
      const { key, value } = await req.json();
      const { error } = await supabase
        .from("system_config")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
