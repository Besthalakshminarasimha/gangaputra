import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SellRequestNotification {
  requestId: string;
  cropType: string;
  quantity: number;
  count: number;
  farmerName: string;
  phoneNumber: string;
  district: string;
  state: string;
  pickupDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SellRequestNotification = await req.json();
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (!adminEmail) {
      throw new Error("Admin email not configured");
    }

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "Gangaputra <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🦐 New Sell Request: ${data.cropType} from ${data.farmerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488, #10b981); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🦐 New Sell Request</h1>
          </div>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937;">Request Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280;">Crop Type:</td><td style="padding: 8px 0; font-weight: bold;">${data.cropType}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Count:</td><td style="padding: 8px 0; font-weight: bold;">${data.count}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Quantity:</td><td style="padding: 8px 0; font-weight: bold;">${data.quantity} tons</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Farmer Name:</td><td style="padding: 8px 0; font-weight: bold;">${data.farmerName}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Phone:</td><td style="padding: 8px 0; font-weight: bold;">${data.phoneNumber}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Location:</td><td style="padding: 8px 0; font-weight: bold;">${data.district}, ${data.state}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Pickup Date:</td><td style="padding: 8px 0; font-weight: bold;">${data.pickupDate}</td></tr>
            </table>
            <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
              <p style="margin: 0; color: #92400e;">⚡ Please review this request and update the status in the admin dashboard.</p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Admin notification sent:", emailResponse);

    // Also try to send SMS to admin if phone number is configured
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (accountSid && authToken && twilioPhone) {
      try {
        const smsMessage = `New sell request: ${data.cropType} (${data.quantity} tons) from ${data.farmerName} in ${data.district}. Check admin dashboard.`;
        
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: twilioPhone, // Send to admin phone
            From: twilioPhone,
            Body: smsMessage,
          }),
        });
        console.log("SMS notification sent to admin");
      } catch (smsError) {
        console.error("SMS failed but email was sent:", smsError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error notifying admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
