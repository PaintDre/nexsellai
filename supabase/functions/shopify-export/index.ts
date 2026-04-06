import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    const { action, pageTitle, pageHtml, storeDomain, accessToken } = await req.json();

    if (action === "test-connection") {
      // Test the Shopify connection
      const domain = storeDomain || "";
      const token = accessToken || "";
      
      if (!domain || !token) {
        return new Response(
          JSON.stringify({ error: "Missing store domain or access token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const shopifyRes = await fetch(
        `https://${domain}/admin/api/2024-01/shop.json`,
        { headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" } }
      );

      if (!shopifyRes.ok) {
        const errorText = await shopifyRes.text();
        return new Response(
          JSON.stringify({ error: "Invalid credentials", details: errorText }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const shopData = await shopifyRes.json();
      return new Response(
        JSON.stringify({ success: true, shopName: shopData.shop?.name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create-page") {
      // Get user's stored Shopify connection
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: connection } = await serviceClient
        .from("shopify_connections")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!connection) {
        return new Response(
          JSON.stringify({ error: "No Shopify connection found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!pageTitle || !pageHtml) {
        return new Response(
          JSON.stringify({ error: "Missing page title or HTML" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const shopifyRes = await fetch(
        `https://${connection.store_domain}/admin/api/2024-01/pages.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": connection.access_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page: {
              title: pageTitle,
              body_html: pageHtml,
              published: true,
            },
          }),
        }
      );

      if (!shopifyRes.ok) {
        const errorText = await shopifyRes.text();
        return new Response(
          JSON.stringify({ error: "Failed to create Shopify page", details: errorText }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const pageData = await shopifyRes.json();
      const pageUrl = `https://${connection.store_domain}/pages/${pageData.page?.handle || ""}`;

      return new Response(
        JSON.stringify({ success: true, pageUrl, pageId: pageData.page?.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
