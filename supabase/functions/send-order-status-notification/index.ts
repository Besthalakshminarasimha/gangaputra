import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderStatusNotificationRequest {
  orderId: string;
  newStatus: string;
  userEmail: string;
  userName?: string;
  orderTotal?: number;
  itemCount?: number;
  pushSubscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

const getStatusInfo = (status: string): { subject: string; message: string; color: string; icon: string } => {
  switch (status) {
    case 'confirmed':
      return {
        subject: "Order Confirmed! 🎉",
        message: "Great news! Your order has been confirmed and is being prepared for shipment.",
        color: "#3b82f6",
        icon: "✅",
      };
    case 'shipped':
      return {
        subject: "Your Order is on the Way! 🚚",
        message: "Your order has been shipped and is on its way to you. Track your delivery for updates.",
        color: "#8b5cf6",
        icon: "🚚",
      };
    case 'delivered':
      return {
        subject: "Order Delivered! 📦",
        message: "Your order has been delivered successfully. Thank you for shopping with Ganga Aqua!",
        color: "#22c55e",
        icon: "📦",
      };
    case 'cancelled':
      return {
        subject: "Order Cancelled ❌",
        message: "Your order has been cancelled. If you have any questions, please contact our support team.",
        color: "#ef4444",
        icon: "❌",
      };
    default:
      return {
        subject: "Order Status Update",
        message: `Your order status has been updated to: ${status}`,
        color: "#6b7280",
        icon: "📋",
      };
  }
};

const sendPushNotification = async (
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; icon?: string; data?: Record<string, unknown> }
): Promise<boolean> => {
  const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
  const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
  const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") || "mailto:admin@gangaaqua.com";

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("VAPID keys not configured. Push notification skipped.");
    return false;
  }

  try {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    console.log("Push notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-status-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, newStatus, userEmail, userName, orderTotal, itemCount, pushSubscription }: OrderStatusNotificationRequest = await req.json();
    
    if (!orderId || !newStatus || !userEmail) {
      throw new Error("Missing required fields: orderId, newStatus, userEmail");
    }

    console.log(`Processing order status notification: ${newStatus} for order ${orderId}`);

    const statusInfo = getStatusInfo(newStatus);
    
    // Only send notifications for meaningful status changes
    if (!['confirmed', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
      console.log(`No notification needed for status: ${newStatus}`);
      return new Response(
        JSON.stringify({ success: true, message: "No notification needed for this status" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = {
      emailSent: false,
      pushSent: false,
    };

    // Send Push Notification if subscription provided
    if (pushSubscription) {
      const pushPayload = {
        title: `${statusInfo.icon} ${statusInfo.subject}`,
        body: statusInfo.message,
        icon: "/favicon.ico",
        data: {
          orderId,
          status: newStatus,
          url: "/orders",
        },
      };

      results.pushSent = await sendPushNotification(pushSubscription, pushPayload);
    }

    // Send Email Notification
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY);

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🦐 Ganga Aqua</h1>
              <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 14px;">Order Status Update</p>
            </div>
            
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hello ${userName || 'Valued Customer'},</p>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Order Status:</p>
                <span style="display: inline-block; background-color: ${statusInfo.color}; color: #ffffff; padding: 8px 20px; border-radius: 20px; font-size: 16px; font-weight: 600; text-transform: uppercase;">
                  ${newStatus}
                </span>
              </div>
              
              <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                ${statusInfo.message}
              </p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin-bottom: 20px;">
                <p style="color: #374151; font-size: 14px; margin: 0;">
                  <strong>Order ID:</strong> #${orderId.slice(0, 8)}<br>
                  <strong>Items:</strong> ${itemCount || 0} items<br>
                  <strong>Total:</strong> ₹${(orderTotal || 0).toLocaleString()}
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                You can track your order status anytime in the Orders section of your Ganga Aqua app.
              </p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Ganga Aqua. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "Ganga Aqua <onboarding@resend.dev>",
          to: [userEmail],
          subject: `${statusInfo.subject} - Order #${orderId.slice(0, 8)}`,
          html: emailHtml,
        });

        console.log("Email sent successfully:", emailResponse);
        results.emailSent = true;
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    } else {
      console.log("RESEND_API_KEY not configured. Email notification skipped.");
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-order-status-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
