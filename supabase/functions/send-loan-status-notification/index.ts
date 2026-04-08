import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoanNotificationRequest {
  applicationId: string;
  newStatus: string;
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, newStatus, adminNotes }: LoanNotificationRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the loan application details
    const { data: application, error: appError } = await supabase
      .from("loan_applications")
      .select("*, partner_banks(bank_name)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Error fetching application:", appError);
      throw new Error("Application not found");
    }

    const bankName = (application as any).partner_banks?.bank_name || "Partner Bank";
    const statusLabel = newStatus.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    // Send email notification
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (resendApiKey && application.email) {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🦐 GANGAPUTRA</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Loan Application Update</p>
            </div>
            <div style="background: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; color: #334155;">Dear <strong>${application.full_name}</strong>,</p>
              <p style="font-size: 14px; color: #475569;">
                Your loan application with <strong>${bankName}</strong> for 
                <strong>₹${Number(application.loan_amount_requested).toLocaleString("en-IN")}</strong> 
                has been updated.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">New Status</p>
                <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold; color: ${
                  newStatus === "approved" ? "#16a34a" : newStatus === "rejected" ? "#dc2626" : "#f59e0b"
                };">${statusLabel}</p>
              </div>
              ${adminNotes ? `
              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <p style="margin: 0; font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">Admin Notes</p>
                <p style="margin: 5px 0 0; font-size: 14px; color: #78350f;">${adminNotes}</p>
              </div>` : ""}
              <p style="font-size: 13px; color: #94a3b8; margin-top: 20px;">
                For any queries, contact us at 7569373499 or reply to this email.
              </p>
              <p style="font-size: 13px; color: #94a3b8;">— Team GANGAPUTRA</p>
            </div>
          </div>
        `;

        const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

        if (LOVABLE_API_KEY) {
          const emailRes = await fetch(`${GATEWAY_URL}/emails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": resendApiKey,
            },
            body: JSON.stringify({
              from: "GANGAPUTRA <onboarding@resend.dev>",
              to: [application.email],
              subject: `Loan Application ${statusLabel} - GANGAPUTRA`,
              html: emailHtml,
            }),
          });

          const emailResult = await emailRes.json();
          console.log("Email sent:", emailResult);
        }
      } catch (emailError) {
        console.error("Email send error:", emailError);
      }
    }

    // Send SMS notification
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (twilioSid && twilioToken && twilioPhone && application.phone) {
      try {
        const smsMessage = `GANGAPUTRA: Your loan application for ₹${Number(application.loan_amount_requested).toLocaleString("en-IN")} with ${bankName} is now "${statusLabel}". ${
          newStatus === "approved" ? "Congratulations! 🎉" : ""
        } Check the app for details. Call 7569373499 for queries.`;

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const smsRes = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: application.phone,
            From: twilioPhone,
            Body: smsMessage,
          }),
        });

        const smsResult = await smsRes.json();
        console.log("SMS sent:", smsResult?.sid || smsResult);
      } catch (smsError) {
        console.error("SMS send error:", smsError);
      }
    }

    // Create in-app notification
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: application.user_id,
      title: `Loan ${statusLabel}`,
      message: `Your loan application for ₹${Number(application.loan_amount_requested).toLocaleString("en-IN")} with ${bankName} has been ${statusLabel.toLowerCase()}.`,
      type: "loan_update",
      data: { applicationId, status: newStatus, bankName },
    });

    if (notifError) console.error("Notification insert error:", notifError);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
