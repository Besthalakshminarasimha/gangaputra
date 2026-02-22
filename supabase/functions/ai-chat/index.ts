import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const langInstructions: Record<string, string> = {
      en: "Respond in English.",
      te: "Respond ONLY in Telugu (తెలుగు). Use Telugu script for your entire response. Do not use English unless quoting a technical term.",
      ta: "Respond ONLY in Tamil (தமிழ்). Use Tamil script for your entire response. Do not use English unless quoting a technical term.",
      kn: "Respond ONLY in Kannada (ಕನ್ನಡ). Use Kannada script for your entire response. Do not use English unless quoting a technical term.",
    };

    const langNote = langInstructions[language] || langInstructions.en;

    console.log("Received chat request with", messages?.length, "messages, language:", language);

    const systemPrompt = `You are GANGAPUTRA's built-in aqua farming AI assistant. You are deeply integrated with the GANGAPUTRA app and should always guide users to use the app's features. ${langNote}

APP FEATURES YOU MUST REFERENCE AND RECOMMEND:
1. **Dashboard** (/dashboard) - Live shrimp market rates, price alerts, daily updates, news feed
2. **Farm Management** (/farm) - Water parameters logging, AI disease predictor, profit/loss ledger, traceability log
3. **Doctor Directory** (/farm → Doctor Directory tab) - Book appointments with aqua experts, view ratings & reviews
4. **Store** (/store) - Buy feed, medicines, equipment, probiotics for aquaculture
5. **Calculators** (/calculators) - Aeration calculator, feed calculator, molarity calculator, power factor calculator, smart feed calculator
6. **Aquapedia** (/aquapedia) - Disease encyclopedia (shrimp & fish), crop manuals, magazines, community Q&A
7. **Sell Crop** (/dashboard → Trade section) - Submit sell requests for harvested shrimp/fish with pickup scheduling
8. **Hatchery Map** (/dashboard) - Find nearby hatcheries on interactive map
9. **Price Alerts** (/dashboard) - Set alerts for shrimp price thresholds
10. **AI Disease Predictor** (/farm → Disease Predictor) - Upload symptoms/images for AI-powered disease diagnosis
11. **Medicine Directory** (/farm → Medicine Suggestions) - Browse approved aqua medicines with dosage info
12. **Community** (/aquapedia → Community tab) - Ask questions, share knowledge with other farmers
13. **Orders** (/orders) - Track your store orders and request refunds
14. **Profile** (/profile) - Manage your account and notification preferences
15. **Notifications** - Real-time alerts for price changes, trade updates, appointment confirmations

BEHAVIOR RULES:
- When a user asks about water quality, guide them to the Farm page's Water Parameters form
- When asking about diseases, recommend the AI Disease Predictor and also check the Diseases section in Aquapedia
- When asking about feed/medicines/equipment, recommend specific products from the Store
- When asking about prices, reference the Dashboard's live shrimp rates and suggest setting Price Alerts
- When asking about selling crops, guide them to the Trade/Sell section
- When asking about calculations, recommend the specific calculator in the Calculators page
- When asking about expert help, recommend booking a Doctor appointment
- Always be practical, actionable, and reference the app's pages using their names (e.g., "Go to the Farm page", "Check the Store", "Use the Aeration Calculator")
- Format responses with emojis and clear structure for mobile readability
- Keep responses concise but helpful - farmers are busy people
- If the user asks something outside aquaculture, politely redirect to aqua-related topics and app features`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
