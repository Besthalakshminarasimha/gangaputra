import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  to?: string;
  message?: string;
  type?: 'price_alert';
  alerts?: Array<{
    location: string;
    count: string;
    previousRate: number;
    currentRate: number;
    changePercent: number;
    direction: 'up' | 'down';
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: SMSRequest = await req.json();

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      console.log("Twilio credentials not configured - skipping SMS");
      return new Response(JSON.stringify({ success: true, message: "SMS skipped - Twilio not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle price alert SMS
    if (requestData.type === 'price_alert' && requestData.alerts) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get users who have SMS price alerts enabled (using notification preferences)
      const { data: preferences, error: prefError } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('push_price_alerts', true);

      if (prefError) {
        console.error('Error fetching preferences:', prefError);
        throw prefError;
      }

      if (!preferences || preferences.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No users opted in for SMS alerts" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get phone numbers from profiles
      const userIds = preferences.map(p => p.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('sell_crop_requests')
        .select('phone_number, user_id')
        .in('user_id', userIds)
        .not('phone_number', 'is', null);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
      }

      // Get unique phone numbers
      const phoneNumbers = [...new Set(profiles?.map(p => p.phone_number).filter(Boolean) || [])];

      if (phoneNumbers.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No phone numbers found" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build SMS message
      const topAlert = requestData.alerts.reduce((max, a) => 
        Math.abs(a.changePercent) > Math.abs(max.changePercent) ? a : max
      );
      
      const smsMessage = `🦐 Price Alert: ${topAlert.location} Count ${topAlert.count} is now ₹${topAlert.currentRate}/kg (${topAlert.direction === 'up' ? '+' : ''}${topAlert.changePercent}%). Check app for more details. - GANGAPUTRA`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const sentResults = [];

      for (const phone of phoneNumbers.slice(0, 10)) { // Limit to 10 SMS
        try {
          const response = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: phone as string,
              From: fromNumber,
              Body: smsMessage,
            }),
          });

          const result = await response.json();
          
          if (response.ok) {
            sentResults.push({ phone, status: 'sent', sid: result.sid });
            console.log("SMS sent successfully:", result.sid);
          } else {
            sentResults.push({ phone, status: 'failed', error: result.message });
            console.error("Twilio error:", result);
          }
        } catch (smsError) {
          console.error('Error sending SMS to', phone, smsError);
          sentResults.push({ phone, status: 'error', error: String(smsError) });
        }
      }

      return new Response(JSON.stringify({ success: true, results: sentResults }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle direct SMS request
    const { to, message } = requestData;
    
    if (!to || !message) {
      throw new Error("Missing 'to' or 'message' parameter");
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", result);
      throw new Error(result.message || "Failed to send SMS");
    }

    console.log("SMS sent successfully:", result.sid);

    return new Response(JSON.stringify({ success: true, sid: result.sid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);