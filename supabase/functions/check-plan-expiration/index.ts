import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find all profiles with expired plans
    const now = new Date().toISOString();
    const { data: expiredProfiles, error } = await supabase
      .from("profiles")
      .select("user_id, plan, plan_expires_at, full_name")
      .neq("plan", "free")
      .not("plan_expires_at", "is", null)
      .lt("plan_expires_at", now);

    if (error) {
      console.error("Error fetching expired profiles:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let downgraded = 0;
    for (const profile of expiredProfiles || []) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null })
        .eq("user_id", profile.user_id);

      if (updateError) {
        console.error(`Error downgrading ${profile.user_id}:`, updateError);
      } else {
        downgraded++;
        console.log(`Downgraded user ${profile.user_id} (${profile.full_name}) from ${profile.plan} to free`);
      }
    }

    console.log(`Plan expiration check complete: ${downgraded} users downgraded`);
    return new Response(JSON.stringify({ checked: (expiredProfiles || []).length, downgraded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cron error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
