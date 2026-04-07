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
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const shop = url.searchParams.get("shop");
    const state = url.searchParams.get("state");

    if (!code || !shop || !state) {
      return new Response("Missing parameters", { status: 400 });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate state
    const { data: oauthState, error: stateError } = await serviceClient
      .from("shopify_oauth_states")
      .select("*")
      .eq("nonce", state)
      .single();

    if (stateError || !oauthState) {
      return new Response("Invalid or expired state", { status: 400 });
    }

    // Check expiry (10 minutes)
    const createdAt = new Date(oauthState.created_at).getTime();
    if (Date.now() - createdAt > 10 * 60 * 1000) {
      await serviceClient.from("shopify_oauth_states").delete().eq("id", oauthState.id);
      return new Response("State expired", { status: 400 });
    }

    // Exchange code for access token
    const apiKey = Deno.env.get("SHOPIFY_API_KEY");
    const apiSecret = Deno.env.get("SHOPIFY_API_SECRET");

    if (!apiKey || !apiSecret) {
      return new Response("Shopify app not configured", { status: 500 });
    }

    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Token exchange failed:", errorText);
      return new Response("Failed to get access token", { status: 400 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Get shop name
    let shopName = shop;
    try {
      const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" },
      });
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        shopName = shopData.shop?.name || shop;
      }
    } catch {
      // Use domain as fallback
    }

    // Upsert connection
    const { error: upsertError } = await serviceClient
      .from("shopify_connections")
      .upsert(
        {
          user_id: oauthState.user_id,
          store_domain: shop,
          access_token: accessToken,
          shop_name: shopName,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response("Failed to save connection", { status: 500 });
    }

    // Clean up state
    await serviceClient.from("shopify_oauth_states").delete().eq("id", oauthState.id);

    // Redirect back to app
    const appUrl = Deno.env.get("APP_URL") || "https://nexsellai.lovable.app";
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/landings?shopify=connected` },
    });
  } catch (err) {
    console.error("OAuth callback error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
