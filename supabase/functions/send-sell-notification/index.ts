import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const adminEmail = Deno.env.get("ADMIN_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SellCropRequest {
  crop_type: string;
  count: number;
  quantity_tons: number;
  pickup_date: string;
  state: string;
  district: string;
  address: string;
  phone_number?: string;
  preferred_contact_time?: string;
  expected_price_per_kg?: number;
  farmer_name?: string;
  farmer_email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-sell-notification function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: SellCropRequest = await req.json();
    console.log("Request data received:", requestData);

    if (!adminEmail) {
      console.error("ADMIN_EMAIL not configured");
      return new Response(
        JSON.stringify({ error: "Admin email not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const totalEstimate = requestData.expected_price_per_kg 
      ? (requestData.quantity_tons * 1000 * requestData.expected_price_per_kg).toLocaleString('en-IN')
      : 'Not specified';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9, #22c55e); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌾 New Sell Crop Request</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e40af; margin-top: 0;">Farmer Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Name:</td>
              <td style="padding: 8px 0; font-weight: bold;">${requestData.farmer_name || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Email:</td>
              <td style="padding: 8px 0;">${requestData.farmer_email || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Phone:</td>
              <td style="padding: 8px 0; font-weight: bold;">${requestData.phone_number || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Preferred Contact Time:</td>
              <td style="padding: 8px 0;">${requestData.preferred_contact_time || 'Any time'}</td>
            </tr>
          </table>
          
          <h2 style="color: #1e40af; margin-top: 20px;">Crop Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Crop Type:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #16a34a;">${requestData.crop_type}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Count:</td>
              <td style="padding: 8px 0; font-weight: bold;">${requestData.count}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Quantity:</td>
              <td style="padding: 8px 0; font-weight: bold;">${requestData.quantity_tons} Tons</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Expected Price:</td>
              <td style="padding: 8px 0; font-weight: bold;">₹${requestData.expected_price_per_kg || 'Not specified'}/kg</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Total Estimate:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1e40af;">₹${totalEstimate}</td>
            </tr>
          </table>
          
          <h2 style="color: #1e40af; margin-top: 20px;">Pickup Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Pickup Date:</td>
              <td style="padding: 8px 0; font-weight: bold;">${new Date(requestData.pickup_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Location:</td>
              <td style="padding: 8px 0;">${requestData.district}, ${requestData.state}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Address:</td>
              <td style="padding: 8px 0;">${requestData.address}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #1e40af; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="color: white; margin: 0;">Please review and respond to this request at your earliest convenience.</p>
        </div>
      </div>
    `;

    console.log("Sending email to:", adminEmail);
    
    const emailResponse = await resend.emails.send({
      from: "GANGAPUTRA <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🌾 New Sell Crop Request: ${requestData.quantity_tons} Tons of ${requestData.crop_type}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-sell-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
