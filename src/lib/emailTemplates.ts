export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  category: "bienvenida" | "recordatorio" | "descuento" | "abandono" | "reactivacion";
}

const brand = "#2E9B63";

const btn = (text: string, url = "#") =>
  `<a href="${url}" style="display:inline-block;padding:12px 28px;background:${brand};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${text}</a>`;

export const emailTemplates: EmailTemplate[] = [
  {
    id: "welcome",
    name: "🎉 Bienvenida",
    category: "bienvenida",
    subject: "¡Tu cuenta en Nexsell está lista!",
    body_html: `
<h1 style="color:#1a1a1a;font-size:24px;margin-bottom:8px;">¡Bienvenido/a, {{nombre}}! 🎉</h1>
<p style="color:#555;font-size:15px;line-height:1.6;">Tu cuenta en <strong>Nexsell</strong> ya está activa. Ahora puedes crear landing pages y banners de alta conversión con inteligencia artificial.</p>
<p style="color:#555;font-size:15px;line-height:1.6;">Empieza en 3 pasos:</p>
<ol style="color:#555;font-size:15px;line-height:1.8;">
  <li>Agrega tu primer producto</li>
  <li>Genera una landing page con IA</li>
  <li>Publica y comparte con tus clientes</li>
</ol>
<div style="text-align:center;margin:28px 0;">${btn("Crear mi primera landing", "https://nexsellai.lovable.app/products")}</div>
<p style="color:#999;font-size:13px;">¿Dudas? Responde este email y te ayudamos.</p>`,
  },
  {
    id: "reminder-no-landing",
    name: "📋 Recordatorio: crea tu landing",
    category: "recordatorio",
    subject: "{{nombre}}, tu cuenta te espera — crea tu primera landing",
    body_html: `
<h1 style="color:#1a1a1a;font-size:24px;margin-bottom:8px;">¡Hola, {{nombre}}!</h1>
<p style="color:#555;font-size:15px;line-height:1.6;">Notamos que aún no has creado tu primera landing page. ¡No te pierdas la oportunidad!</p>
<p style="color:#555;font-size:15px;line-height:1.6;">Con Nexsell puedes generar una página de ventas profesional en menos de 2 minutos usando inteligencia artificial.</p>
<div style="text-align:center;margin:28px 0;">${btn("Crear landing ahora", "https://nexsellai.lovable.app/products")}</div>
<p style="color:#999;font-size:13px;">Si necesitas ayuda, estamos aquí para ti.</p>`,
  },
  {
    id: "discount-first-plan",
    name: "🏷️ Oferta: 20% OFF en tu plan",
    category: "descuento",
    subject: "{{nombre}}, tienes 20% de descuento en Nexsell 🎁",
    body_html: `
<h1 style="color:#1a1a1a;font-size:24px;margin-bottom:8px;">¡Oferta exclusiva para ti, {{nombre}}!</h1>
<p style="color:#555;font-size:15px;line-height:1.6;">Sabemos que estás evaluando opciones. Por eso, te ofrecemos un <strong style="color:${brand};">20% de descuento</strong> en tu primer mes de cualquier plan pago.</p>
<div style="background:#f0faf4;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
  <p style="font-size:28px;font-weight:700;color:${brand};margin:0;">20% OFF</p>
  <p style="color:#555;font-size:14px;margin:4px 0 0;">En planes Starter y Pro</p>
</div>
<div style="text-align:center;margin:28px 0;">${btn("Ver planes con descuento", "https://nexsellai.lovable.app/pricing")}</div>
<p style="color:#999;font-size:13px;">Esta oferta es válida por 48 horas.</p>`,
  },
  {
    id: "abandonment",
    name: "🛒 Abandono: completa tu suscripción",
    category: "abandono",
    subject: "{{nombre}}, tu suscripción quedó pendiente",
    body_html: `
<h1 style="color:#1a1a1a;font-size:24px;margin-bottom:8px;">¿Necesitas ayuda, {{nombre}}?</h1>
<p style="color:#555;font-size:15px;line-height:1.6;">Vimos que iniciaste el proceso de suscripción pero no lo completaste. ¡No te preocupes! Tu plan te está esperando.</p>
<p style="color:#555;font-size:15px;line-height:1.6;">Como agradecimiento por tu interés, te ofrecemos un <strong style="color:${brand};">descuento especial</strong> si completas tu suscripción hoy.</p>
<div style="text-align:center;margin:28px 0;">${btn("Completar suscripción", "https://nexsellai.lovable.app/pricing")}</div>
<p style="color:#999;font-size:13px;">¿Tienes alguna duda sobre los planes? Responde este email.</p>`,
  },
  {
    id: "reactivation",
    name: "💚 Reactivación: te extrañamos",
    category: "reactivacion",
    subject: "Te extrañamos, {{nombre}} — vuelve a Nexsell",
    body_html: `
<h1 style="color:#1a1a1a;font-size:24px;margin-bottom:8px;">¡Hola de nuevo, {{nombre}}! 👋</h1>
<p style="color:#555;font-size:15px;line-height:1.6;">Hace un tiempo que no te vemos por Nexsell y queríamos saber cómo estás.</p>
<p style="color:#555;font-size:15px;line-height:1.6;">Hemos agregado nuevas funcionalidades que te pueden interesar:</p>
<ul style="color:#555;font-size:15px;line-height:1.8;">
  <li>🎨 Nuevas plantillas de landing pages</li>
  <li>📊 Banners con IA mejorada</li>
  <li>🚀 Mejor rendimiento y velocidad</li>
</ul>
<div style="text-align:center;margin:28px 0;">${btn("Volver a Nexsell", "https://nexsellai.lovable.app/dashboard")}</div>
<p style="color:#999;font-size:13px;">Tu cuenta sigue activa y lista para usar.</p>`,
  },
];

export const getEmailPreviewHtml = (bodyHtml: string, sampleName = "Juan Ejemplo"): string => {
  const personalizedHtml = bodyHtml.replace(/\{\{nombre\}\}/g, sampleName);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://fizryssrfsojiavxmhrt.supabase.co/storage/v1/object/public/email-assets/logo-ns.png" alt="Nexsell" style="height:40px;" />
    </div>
    <div style="padding:20px;">${personalizedHtml}</div>
    <p style="color:#aaa;font-size:12px;text-align:center;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">
      Este email fue enviado por Nexsell. Si no deseas recibir más emails, contacta a soporte.
    </p>
  </div>
</body>
</html>`;
};
