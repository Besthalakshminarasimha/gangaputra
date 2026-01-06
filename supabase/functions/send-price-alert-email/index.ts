import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceAlert {
  location: string;
  count: string;
  previousRate: number;
  currentRate: number;
  changePercent: number;
  direction: 'up' | 'down';
}

interface PriceAlertEmailRequest {
  alerts: PriceAlert[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { alerts }: PriceAlertEmailRequest = await req.json();

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No alerts to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${alerts.length} price alerts`);

    // Get all users who have enabled email price alerts
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('email_price_alerts', true);

    if (prefError) {
      console.error('Error fetching notification preferences:', prefError);
      throw prefError;
    }

    if (!preferences || preferences.length === 0) {
      console.log('No users with email price alerts enabled');
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get email addresses for these users
    const userIds = preferences.map(p => p.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    // Generate email content
    const generateAlertRows = () => {
      return alerts.map(alert => {
        const color = alert.direction === 'up' ? '#22c55e' : '#ef4444';
        const arrow = alert.direction === 'up' ? '↑' : '↓';
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 500;">${alert.location}</td>
            <td style="padding: 12px;">Count ${alert.count}</td>
            <td style="padding: 12px;">₹${alert.previousRate}</td>
            <td style="padding: 12px; font-weight: bold;">₹${alert.currentRate}</td>
            <td style="padding: 12px; color: ${color}; font-weight: bold;">
              ${arrow} ${alert.changePercent > 0 ? '+' : ''}${alert.changePercent}%
            </td>
          </tr>
        `;
      }).join('');
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
            .content { background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">📊 Shrimp Price Alert</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Significant price changes detected</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We've detected significant price changes (5% or more) in the shrimp markets you follow:</p>
              
              <table style="margin: 20px 0;">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Count</th>
                    <th>Previous</th>
                    <th>Current</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  ${generateAlertRows()}
                </tbody>
              </table>
              
              <p style="background: #f0f9ff; padding: 16px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                <strong>Tip:</strong> Log in to your dashboard to see detailed market analysis and historical trends.
              </p>
              
              <p>Best regards,<br>The AquaFarm Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you enabled price alerts.</p>
              <p>To unsubscribe, update your notification preferences in your profile settings.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails to all subscribed users
    let sentCount = 0;
    let errorCount = 0;

    for (const profile of profiles || []) {
      if (!profile.email) continue;

      try {
        const { error: emailError } = await resend.emails.send({
          from: 'AquaFarm <onboarding@resend.dev>',
          to: [profile.email],
          subject: `📊 Price Alert: ${alerts.length} significant change${alerts.length > 1 ? 's' : ''} detected`,
          html: emailHtml.replace('Hello,', `Hello ${profile.full_name || 'Farmer'},`),
        });

        if (emailError) {
          console.error(`Failed to send to ${profile.email}:`, emailError);
          errorCount++;
        } else {
          console.log(`Email sent to ${profile.email}`);
          sentCount++;
        }
      } catch (err) {
        console.error(`Error sending to ${profile.email}:`, err);
        errorCount++;
      }
    }

    console.log(`Price alert emails: ${sentCount} sent, ${errorCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentCount,
        errorCount,
        message: `Sent ${sentCount} price alert emails`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending price alert emails:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
