import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationRequest {
  requestId: string;
  userId: string;
  cropType: string;
  quantityTons: number;
  oldStatus: string;
  newStatus: string;
  adminNotes?: string;
}

const getStatusMessage = (status: string): string => {
  switch (status) {
    case 'approved':
      return 'Your request has been approved! Our team will contact you soon to arrange the pickup.';
    case 'rejected':
      return 'Unfortunately, your request has been rejected. Please contact us for more information.';
    case 'completed':
      return 'Your sell crop request has been completed successfully. Thank you for using GANGAPUTRA!';
    case 'cancelled':
      return 'Your request has been cancelled.';
    default:
      return `Your request status has been updated to: ${status}`;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'approved': return '#22c55e';
    case 'rejected': return '#ef4444';
    case 'completed': return '#3b82f6';
    case 'cancelled': return '#6b7280';
    case 'pending': return '#eab308';
    default: return '#6b7280';
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-status-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, userId, cropType, quantityTons, oldStatus, newStatus, adminNotes }: StatusNotificationRequest = await req.json();
    
    console.log(`Processing status change notification: ${oldStatus} -> ${newStatus} for request ${requestId}`);

    // Create Supabase client to get user email
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    if (!profile?.email) {
      console.log("No email found for user, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No email found, notification skipped" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userName = profile.full_name || "Valued Customer";
    const statusMessage = getStatusMessage(newStatus);
    const statusColor = getStatusColor(newStatus);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #0ea5e9, #06b6d4); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🦐 GANGAPUTRA</h1>
            <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 14px;">Sell Crop Request Update</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hello ${userName},</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Request Status:</p>
              <span style="display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                ${newStatus}
              </span>
            </div>
            
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
              ${statusMessage}
            </p>
            
            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin-bottom: 20px;">
              <p style="color: #374151; font-size: 14px; margin: 0;">
                <strong>Crop Type:</strong> ${cropType}<br>
                <strong>Quantity:</strong> ${quantityTons} tons
              </p>
            </div>
            
            ${adminNotes ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>Note from Admin:</strong><br>
                ${adminNotes}
              </p>
            </div>
            ` : ''}
            
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
              If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} GANGAPUTRA. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "GANGAPUTRA <onboarding@resend.dev>",
      to: [profile.email],
      subject: `Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - GANGAPUTRA`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-status-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
