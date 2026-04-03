const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const { email, teamName, loginUrl } = await req.json();

    if (!email || !teamName) {
      return new Response(
        JSON.stringify({ error: "email and teamName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const round2Link = loginUrl || "https://zenthorix-pixelpuzzle.lovable.app/student";

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

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Zenthorix <onboarding@resend.dev>",
        to: [email],
        subject: `🎉 ${teamName} — You're in Round 2!`,
        html: htmlBody,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Resend API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
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
