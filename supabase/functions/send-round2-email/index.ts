import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SMTP_HOST = Deno.env.get("SMTP_HOST");
    const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") || "587");
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      throw new Error("SMTP credentials are not configured");
    }

    const { email, teamName, loginUrl } = await req.json();

    if (!email || !teamName) {
      return new Response(
        JSON.stringify({ error: "email and teamName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const round2Link = loginUrl || "https://zenthorix-quiztronix-cse.lovable.app/student";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Zenthorix Quiz Arena</p>
        </div>
        <div style="padding: 30px 20px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">Hey <strong>${teamName}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
            You have been selected for <strong>Round 2</strong> of the Zenthorix Quiz! 🚀
          </p>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
            Log in with your <strong>Team Name</strong> and <strong>Phone Number</strong> to continue.
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${round2Link}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Join Round 2 →
            </a>
          </div>
          <p style="font-size: 13px; color: #9ca3af; text-align: center;">Good luck! 🍀</p>
        </div>
      </div>
    `;

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: false,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    });

    await client.send({
      from: `Zenthorix <${SMTP_USER}>`,
      to: email,
      subject: `🎉 ${teamName} — You're in Round 2!`,
      content: "You have been selected for Round 2!",
      html: htmlBody,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Email send error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
