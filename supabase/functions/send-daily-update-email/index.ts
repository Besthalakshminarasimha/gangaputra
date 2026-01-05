import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyUpdateEmailRequest {
  updateId: string;
  title: string;
  message: string;
  targetAudience?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-daily-update-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { updateId, title, message, targetAudience }: DailyUpdateEmailRequest = await req.json();
    
    console.log(`Processing daily update email for: ${title}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users who have email_daily_updates enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('email_daily_updates', true);

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
      throw prefError;
    }

    const userIds = preferences?.map(p => p.user_id) || [];
    
    if (userIds.length === 0) {
      console.log("No users have email notifications enabled");
      return new Response(
        JSON.stringify({ success: true, message: "No users to notify", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user emails
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      throw profileError;
    }

    const validProfiles = profiles?.filter(p => p.email) || [];
    
    if (validProfiles.length === 0) {
      console.log("No valid email addresses found");
      return new Response(
        JSON.stringify({ success: true, message: "No valid emails found", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    // Send emails to each user
    for (const profile of validProfiles) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🦐 GANGAPUTRA</h1>
              <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 14px;">Daily Update</p>
            </div>
            
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hello ${profile.full_name || 'Valued User'},</p>
              
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
                <h2 style="color: #92400e; font-size: 18px; margin: 0 0 10px 0;">${title}</h2>
                <p style="color: #78350f; font-size: 15px; line-height: 1.6; margin: 0;">
                  ${message}
                </p>
              </div>
              
              <a href="https://gangaputra.lovable.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px;">
                View Dashboard
              </a>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                Stay updated with the latest aquaculture information!
              </p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You received this email because you have daily update notifications enabled.<br>
                <a href="https://gangaputra.lovable.app/profile" style="color: #0ea5e9;">Manage notification preferences</a>
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} GANGAPUTRA. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "GANGAPUTRA <onboarding@resend.dev>",
          to: [profile.email],
          subject: `📢 ${title} - GANGAPUTRA Update`,
          html: emailHtml,
        });

        console.log(`Email sent to ${profile.email}:`, emailResponse);
        sentCount++;
      } catch (emailError: any) {
        console.error(`Error sending email to ${profile.email}:`, emailError);
        errors.push(`${profile.email}: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        total: validProfiles.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-daily-update-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
