import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Only allow calls from service role (internal)
    if (!authHeader || !authHeader.includes(serviceKey)) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const { email, name, planName, amount, period, paymentId, expiresAt } = await req.json();

    const formattedAmount = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
    const formattedExpires = new Date(expiresAt).toLocaleDateString("es-CL", {
      year: "numeric", month: "long", day: "numeric",
    });
    const periodLabel = period === "annual" ? "Anual" : "Mensual";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://fizryssrfsojiavxmhrt.supabase.co/storage/v1/object/public/email-assets/logo-ns.png" alt="Nexsell" style="height:40px;" />
    </div>
    
    <div style="background:#f8faf9;border-radius:12px;padding:32px;border:1px solid #e5ebe8;">
      <h1 style="color:#1a1a1a;font-size:24px;margin:0 0 8px;">¡Pago confirmado! 🎉</h1>
      <p style="color:#555;font-size:15px;margin:0 0 24px;">
        Hola${name ? ` ${name}` : ""}, tu pago ha sido procesado exitosamente.
      </p>
      
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:10px 0;color:#888;border-bottom:1px solid #e5ebe8;">Plan</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;color:#1a1a1a;border-bottom:1px solid #e5ebe8;">Nexsell ${planName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#888;border-bottom:1px solid #e5ebe8;">Período</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;color:#1a1a1a;border-bottom:1px solid #e5ebe8;">${periodLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#888;border-bottom:1px solid #e5ebe8;">Monto</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;color:#249b5e;border-bottom:1px solid #e5ebe8;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#888;border-bottom:1px solid #e5ebe8;">Válido hasta</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;color:#1a1a1a;border-bottom:1px solid #e5ebe8;">${formattedExpires}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#888;">ID Transacción</td>
          <td style="padding:10px 0;text-align:right;font-family:monospace;color:#888;font-size:12px;">${paymentId}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <a href="https://nexsellai.lovable.app/dashboard" style="display:inline-block;background:#249b5e;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">
        Ir a mi Dashboard
      </a>
    </div>

    <p style="color:#aaa;font-size:12px;text-align:center;margin-top:32px;">
      Este es un email automático de Nexsell. No respondas a este mensaje.
    </p>
  </div>
</body>
</html>`;

    // Use Lovable Cloud email sending
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (lovableApiKey) {
      // Send via Lovable transactional email API
      const response = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          to: email,
          subject: `✅ Pago confirmado — Nexsell ${planName} ${periodLabel}`,
          html,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Email send error:", errText);
      }
    } else {
      console.log("LOVABLE_API_KEY not set, skipping email. Would send to:", email);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Send payment email error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
