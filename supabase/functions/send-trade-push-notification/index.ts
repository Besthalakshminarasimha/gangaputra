import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradeNotificationRequest {
  userId: string;
  requestId: string;
  cropType: string;
  oldStatus: string;
  newStatus: string;
  adminNotes?: string;
}

function getStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌',
    completed: '🎉',
    cancelled: '🚫',
  };
  return emojiMap[status] || '📋';
}

function getStatusMessage(status: string): string {
  const messageMap: Record<string, string> = {
    pending: 'is now pending review',
    approved: 'has been approved! We will contact you soon.',
    rejected: 'has been rejected',
    completed: 'has been marked as completed!',
    cancelled: 'has been cancelled',
  };
  return messageMap[status] || `status changed to ${status}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      userId,
      requestId,
      cropType,
      oldStatus,
      newStatus,
      adminNotes,
    }: TradeNotificationRequest = await req.json();

    console.log(`Processing trade notification for user ${userId}, request ${requestId}`);

    // Check user's notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('push_trade_alerts')
      .eq('user_id', userId)
      .single();

    if (prefError) {
      console.log('No notification preferences found, defaulting to enabled');
    }

    const pushEnabled = preferences?.push_trade_alerts !== false;

    if (!pushEnabled) {
      console.log('User has disabled trade push notifications');
      return new Response(
        JSON.stringify({ success: true, message: 'Push notifications disabled by user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile for notification
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    const userName = profile?.full_name || 'Farmer';
    const emoji = getStatusEmoji(newStatus);
    const statusMessage = getStatusMessage(newStatus);

    // Log the notification event for tracking
    console.log(`Trade notification: ${cropType} request for ${userName} ${statusMessage}`);

    // The actual push notification would be sent via Web Push API
    // For now, we return the notification data that the frontend can use
    const notificationPayload = {
      title: `${emoji} Trade Request Update`,
      body: `Your ${cropType} sell request ${statusMessage}${adminNotes ? ` Note: ${adminNotes}` : ''}`,
      data: {
        type: 'trade_status',
        requestId,
        cropType,
        oldStatus,
        newStatus,
        url: '/dashboard',
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification: notificationPayload,
        message: 'Push notification prepared'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending trade push notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
