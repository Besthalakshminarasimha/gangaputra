import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TTSRequest {
  text: string;
  language: "en" | "hi" | "te" | "ta" | "kn";
}

// Google Cloud TTS language codes and voice mappings
const voiceConfig: Record<string, { languageCode: string; name: string }> = {
  en: { languageCode: "en-IN", name: "en-IN-Wavenet-A" }, // Female Indian English
  hi: { languageCode: "hi-IN", name: "hi-IN-Wavenet-A" }, // Female Hindi
  te: { languageCode: "te-IN", name: "te-IN-Standard-A" }, // Female Telugu
  ta: { languageCode: "ta-IN", name: "ta-IN-Wavenet-A" }, // Female Tamil
  kn: { languageCode: "kn-IN", name: "kn-IN-Wavenet-A" }, // Female Kannada
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language = "en" }: TTSRequest = await req.json();

    const apiKey = Deno.env.get("GOOGLE_CLOUD_TTS_API_KEY");

    // No key configured -> tell the client to use the browser voice instead of failing.
    if (!apiKey) {
      return new Response(
        JSON.stringify({ fallback: true, reason: "tts_not_configured", text, language }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const voice = voiceConfig[language] || voiceConfig.en;

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: voice.languageCode,
            name: voice.name,
            ssmlGender: "FEMALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.95, // Slightly slower for clarity
            pitch: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Google TTS error:", response.status, error);
      // Invalid/expired key or quota issue -> graceful browser fallback.
      return new Response(
        JSON.stringify({ fallback: true, reason: "tts_provider_error", text, language }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ audioContent: result.audioContent }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in TTS:", error);
    return new Response(
      JSON.stringify({ fallback: true, reason: "tts_exception" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};


serve(handler);
