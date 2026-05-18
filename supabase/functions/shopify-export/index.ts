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
    const body = await req.json();
    const { action } = body;

    if (action === "oauth-start") {
      const { storeDomain } = body;
      if (!storeDomain) {
        return new Response(
          JSON.stringify({ error: "Missing store domain" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const apiKey = Deno.env.get("SHOPIFY_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Shopify app not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Generate nonce
      const nonce = crypto.randomUUID();

      // Save state
      await serviceClient.from("shopify_oauth_states").insert({
        user_id: userId,
        nonce,
        store_domain: storeDomain,
      });

      const scopes = "write_content,write_themes,read_products,write_products";
      const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/shopify-oauth-callback`;
      const authUrl = `https://${storeDomain}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create-page") {
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

      const { pageTitle, pageHtml } = body;
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

    if (action === "export-theme") {
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

      const { liquidContent, templateContent } = body;
      if (!liquidContent || !templateContent) {
        return new Response(
          JSON.stringify({ error: "Missing liquidContent or templateContent" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 1: Get the active (main) theme
      const themesRes = await fetch(
        `https://${connection.store_domain}/admin/api/2024-01/themes.json`,
        {
          headers: {
            "X-Shopify-Access-Token": connection.access_token,
            "Content-Type": "application/json",
          },
        }
      );

      if (!themesRes.ok) {
        const errorText = await themesRes.text();
        return new Response(
          JSON.stringify({ error: "Failed to fetch Shopify themes", details: errorText }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const themesData = await themesRes.json();
      const mainTheme = themesData.themes?.find((t: any) => t.role === "main");

      if (!mainTheme) {
        return new Response(
          JSON.stringify({ error: "No active theme found in Shopify store" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const themeId = mainTheme.id;
      const assetsUrl = `https://${connection.store_domain}/admin/api/2024-01/themes/${themeId}/assets.json`;
      const shopifyHeaders = {
        "X-Shopify-Access-Token": connection.access_token,
        "Content-Type": "application/json",
      };

      // Step 2: Upload section and product template in parallel
      const [sectionRes, templateRes] = await Promise.all([
        fetch(assetsUrl, {
          method: "PUT",
          headers: shopifyHeaders,
          body: JSON.stringify({
            asset: {
              key: "sections/nexsell-landing.liquid",
              value: liquidContent,
            },
          }),
        }),
        fetch(assetsUrl, {
          method: "PUT",
          headers: shopifyHeaders,
          body: JSON.stringify({
            asset: {
              key: "templates/product.nexsell.json",
              value: templateContent,
            },
          }),
        }),
      ]);

      if (!sectionRes.ok) {
        const errorText = await sectionRes.text();
        return new Response(
          JSON.stringify({ error: "Failed to upload Liquid section", details: errorText }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!templateRes.ok) {
        const errorText = await templateRes.text();
        return new Response(
          JSON.stringify({ error: "Failed to upload product template", details: errorText }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          themeName: mainTheme.name,
          storeDomain: connection.store_domain,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "publish-page") {
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

      const {
        landingId,
        pageTitle,
        handle: requestedHandle,
        liquidContent,
        templateContent,
        existingPageId,
      } = body;

      if (!landingId || !pageTitle || !liquidContent || !templateContent) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sanitize handle (Shopify allows lowercase alphanumerics + dashes)
      const baseHandle = (requestedHandle || pageTitle)
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "nexsell-landing";
      const templateSuffix = `nexsell-${baseHandle}`.slice(0, 50);

      // 1. Get active theme
      const themesRes = await fetch(
        `https://${connection.store_domain}/admin/api/2024-01/themes.json`,
        { headers: { "X-Shopify-Access-Token": connection.access_token } }
      );
      if (!themesRes.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch themes", details: await themesRes.text() }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const themesData = await themesRes.json();
      const mainTheme = themesData.themes?.find((t: any) => t.role === "main");
      if (!mainTheme) {
        return new Response(
          JSON.stringify({ error: "No active theme found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const themeId = mainTheme.id;
      const assetsUrl = `https://${connection.store_domain}/admin/api/2024-01/themes/${themeId}/assets.json`;
      const shopifyHeaders = {
        "X-Shopify-Access-Token": connection.access_token,
        "Content-Type": "application/json",
      };

      // 2. Upload section + page template in parallel
      const [sectionRes, templateRes] = await Promise.all([
        fetch(assetsUrl, {
          method: "PUT",
          headers: shopifyHeaders,
          body: JSON.stringify({
            asset: { key: "sections/nexsell-landing.liquid", value: liquidContent },
          }),
        }),
        fetch(assetsUrl, {
          method: "PUT",
          headers: shopifyHeaders,
          body: JSON.stringify({
            asset: { key: `templates/page.${templateSuffix}.json`, value: templateContent },
          }),
        }),
      ]);

      if (!sectionRes.ok) {
        return new Response(
          JSON.stringify({ error: "Section upload failed", details: await sectionRes.text() }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!templateRes.ok) {
        return new Response(
          JSON.stringify({ error: "Template upload failed", details: await templateRes.text() }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. Create or update Shopify Page
      let pageId = existingPageId;
      let pageData: any = null;

      const pagePayload = {
        page: {
          title: pageTitle,
          handle: baseHandle,
          template_suffix: templateSuffix,
          published: true,
          body_html: "",
        },
      };

      if (pageId) {
        const updateRes = await fetch(
          `https://${connection.store_domain}/admin/api/2024-01/pages/${pageId}.json`,
          { method: "PUT", headers: shopifyHeaders, body: JSON.stringify({ page: { id: pageId, ...pagePayload.page } }) }
        );
        if (!updateRes.ok) {
          // Page may have been deleted in Shopify — fall back to create
          const createRes = await fetch(
            `https://${connection.store_domain}/admin/api/2024-01/pages.json`,
            { method: "POST", headers: shopifyHeaders, body: JSON.stringify(pagePayload) }
          );
          if (!createRes.ok) {
            return new Response(
              JSON.stringify({ error: "Page create failed", details: await createRes.text() }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          pageData = await createRes.json();
        } else {
          pageData = await updateRes.json();
        }
      } else {
        const createRes = await fetch(
          `https://${connection.store_domain}/admin/api/2024-01/pages.json`,
          { method: "POST", headers: shopifyHeaders, body: JSON.stringify(pagePayload) }
        );
        if (!createRes.ok) {
          return new Response(
            JSON.stringify({ error: "Page create failed", details: await createRes.text() }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        pageData = await createRes.json();
      }

      const finalPage = pageData.page;
      const pageUrl = `https://${connection.store_domain}/pages/${finalPage.handle}`;

      // 4. Save tracking info back to landings table
      await serviceClient
        .from("landings")
        .update({
          shopify_page_id: String(finalPage.id),
          shopify_page_handle: finalPage.handle,
          shopify_synced_at: new Date().toISOString(),
        })
        .eq("id", landingId)
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({
          success: true,
          pageId: finalPage.id,
          handle: finalPage.handle,
          pageUrl,
          themeName: mainTheme.name,
          isUpdate: !!existingPageId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disconnect") {
      const { error } = await supabase
        .from("shopify_connections")
        .delete()
        .eq("user_id", userId);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
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
