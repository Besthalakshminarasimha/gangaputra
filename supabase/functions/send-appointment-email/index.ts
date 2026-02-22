import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to_email: string;
  farmer_name: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  status: "confirmed" | "cancelled";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email, farmer_name, doctor_name, appointment_date, appointment_time, status }: EmailRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.log("Resend API key not configured - skipping email");
      return new Response(JSON.stringify({ success: true, message: "Email skipped" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isConfirmed = status === "confirmed";
    const subject = isConfirmed
      ? `✅ Appointment Confirmed with Dr. ${doctor_name}`
      : `❌ Appointment Cancelled with Dr. ${doctor_name}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${isConfirmed ? "#059669" : "#DC2626"}; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${isConfirmed ? "✅ Appointment Confirmed" : "❌ Appointment Cancelled"}</h1>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px;">Hello <strong>${farmer_name || "Farmer"}</strong>,</p>
          <p style="font-size: 15px;">
            Your appointment with <strong>Dr. ${doctor_name}</strong> has been 
            <strong style="color: ${isConfirmed ? "#059669" : "#DC2626"};">${status}</strong>.
          </p>
          <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
            <p style="margin: 4px 0;"><strong>📅 Date:</strong> ${appointment_date}</p>
            <p style="margin: 4px 0;"><strong>🕐 Time:</strong> ${appointment_time}</p>
            <p style="margin: 4px 0;"><strong>👨‍⚕️ Doctor:</strong> Dr. ${doctor_name}</p>
            <p style="margin: 4px 0;"><strong>📋 Status:</strong> ${status.toUpperCase()}</p>
          </div>
          ${isConfirmed
            ? "<p>Please arrive 10 minutes before your scheduled time. If you need to reschedule, contact us through the app.</p>"
            : "<p>If you'd like to rebook, please visit the Doctor Directory in the app.</p>"
          }
          <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">— GANGAPUTRA Aqua Farming</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GANGAPUTRA <onboarding@resend.dev>",
        to: [to_email],
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Appointment email sent:", result.id);

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending appointment email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
