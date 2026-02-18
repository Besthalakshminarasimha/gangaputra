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
    const { symptoms, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Disease prediction request - symptoms:", symptoms ? "yes" : "no", "image:", imageBase64 ? "yes" : "no");

    const systemPrompt = `You are an expert aquaculture veterinarian and disease diagnostician with 20+ years of experience in shrimp and fish diseases. Your task is to analyze symptoms and/or images to identify diseases in aquaculture species.

You MUST respond with ONLY a valid JSON object in this exact format, nothing else:
{
  "disease": "Full disease name",
  "confidence": <number 0-100>,
  "treatment": "Detailed, actionable treatment steps",
  "prevention": "Specific prevention measures",
  "severity": "<low|medium|high>"
}

Common aquaculture diseases to consider:
SHRIMP: White Spot Syndrome (WSSV), Early Mortality Syndrome (EMS/AHPND), Vibriosis, White Feces Disease (WFD), Infectious Hypodermal and Hematopoietic Necrosis (IHHNV), Taura Syndrome, Yellow Head Disease, Black Gill Disease, Loose Shell Syndrome, Enterocytozoon hepatopenaei (EHP), Monodon Baculovirus (MBV)
FISH: Epizootic Ulcerative Syndrome (EUS), Columnaris Disease, Ichthyophthirius (White Spot/Ich), Streptococcosis, Aeromonas infections, Gill Rot, Fin Rot, Dropsy, Saprolegniasis (Fungal infections), Viral Nervous Necrosis (VNN)

Guidelines:
- Base confidence on how well symptoms/image match known disease patterns
- If symptoms are vague, give lower confidence and mention differential diagnoses in treatment
- Always recommend consulting a vet in treatment
- Be specific about medications, dosages, and water parameters in treatment
- Include biosecurity measures in prevention`;

    // Build user message content
    const userContent: any[] = [];

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageBase64, // Already includes data:image/... prefix
        },
      });
      userContent.push({
        type: "text",
        text: `Analyze this image of an aquaculture specimen for disease identification.${symptoms ? ` Additional symptoms observed: ${symptoms}` : ""} Respond with ONLY the JSON object.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Identify the most likely aquaculture disease based on these symptoms: ${symptoms}. Respond with ONLY the JSON object.`,
      });
    }

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
          { role: "user", content: userContent },
        ],
        stream: false,
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

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    console.log("AI response content:", content);

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(
          JSON.stringify({
            disease: parsed.disease || "Unknown Disease",
            confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
            treatment: parsed.treatment || "Consult a qualified aquaculture veterinarian for proper diagnosis.",
            prevention: parsed.prevention || "Maintain optimal water quality and biosecurity protocols.",
            severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "medium",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
      }
    }

    return new Response(
      JSON.stringify({ error: "Could not parse AI response. Please try again with more details." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-disease-predict:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
