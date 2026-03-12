import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Get enabled automations
    const { data: automations, error: autoErr } = await supabase
      .from("email_automations")
      .select("*")
      .eq("enabled", true);

    if (autoErr || !automations?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSent = 0;

    for (const automation of automations) {
      const delayMs = automation.delay_hours * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() - delayMs).toISOString();

      let eligibleUsers: { user_id: string; full_name: string | null }[] = [];

      if (automation.trigger_event === "signup") {
        // Users who signed up before cutoff
        const { data } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .lt("created_at", cutoffDate);
        eligibleUsers = data || [];

      } else if (automation.trigger_event === "no_landing_3d") {
        // Users with 0 landings, signed up > delay_hours ago
        const { data } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .lt("created_at", cutoffDate)
          .eq("landings_used", 0);
        eligibleUsers = data || [];

      } else if (automation.trigger_event === "no_payment_7d") {
        // Free users signed up > delay_hours ago
        const { data } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .lt("created_at", cutoffDate)
          .eq("plan", "free");
        eligibleUsers = data || [];

      } else if (automation.trigger_event === "inactive_14d") {
        // Users who haven't updated anything in delay_hours
        const { data } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .lt("updated_at", cutoffDate);
        eligibleUsers = data || [];
      }

      if (!eligibleUsers.length) continue;

      // Filter out users already sent this automation
      const userIds = eligibleUsers.map((u) => u.user_id);
      const { data: alreadySent } = await supabase
        .from("email_automation_logs")
        .select("user_id")
        .eq("automation_id", automation.id)
        .in("user_id", userIds);

      const sentSet = new Set((alreadySent || []).map((s) => s.user_id));
      const toSend = eligibleUsers.filter((u) => !sentSet.has(u.user_id));

      for (const profile of toSend) {
        try {
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.user_id);
          if (!authUser?.email) continue;

          const personalizedHtml = automation.body_html
            .replace(/\{\{nombre\}\}/g, profile.full_name || "Usuario");

          // Send via send-campaign-email
          await fetch(`${supabaseUrl}/functions/v1/send-campaign-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              to: authUser.email,
              subject: automation.subject.replace(/\{\{nombre\}\}/g, profile.full_name || "Usuario"),
              html: personalizedHtml,
            }),
          });

          // Log the send
          await supabase.from("email_automation_logs").insert({
            automation_id: automation.id,
            user_id: profile.user_id,
            status: "sent",
          });

          totalSent++;
        } catch (e) {
          console.error(`Automation send error for ${profile.user_id}:`, e);
        }
      }
    }

    console.log(`Processed automations: ${totalSent} emails sent`);
    return new Response(JSON.stringify({ processed: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Process automations error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
