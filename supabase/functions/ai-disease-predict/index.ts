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
    const { symptoms, imageBase64, language } = await req.json();
    const lang = language || "english";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Disease prediction request - symptoms:", symptoms ? "yes" : "no", "image:", imageBase64 ? "yes" : "no");

    const langInstruction = lang !== "english"
      ? `\n\nIMPORTANT: You MUST write ALL text values (disease names, treatment, prevention) in ${lang} language. The JSON keys must remain in English, but ALL values must be in ${lang}. For example if language is Telugu, write treatment in Telugu script.`
      : "";

    const systemPrompt = `You are an expert aquaculture veterinarian and disease diagnostician with 20+ years of experience in shrimp and fish diseases. Your task is to analyze symptoms and/or images to identify the top 3 most likely diseases (differential diagnoses) in aquaculture species.

You MUST respond with ONLY a valid JSON object in this exact format, nothing else:
{
  "diagnoses": [
    {
      "disease": "Most likely disease name",
      "confidence": <number 0-100>,
      "treatment": "Detailed, actionable treatment steps",
      "prevention": "Specific prevention measures",
      "severity": "<low|medium|high>"
    },
    {
      "disease": "Second most likely disease",
      "confidence": <number 0-100>,
      "treatment": "Detailed treatment",
      "prevention": "Prevention measures",
      "severity": "<low|medium|high>"
    },
    {
      "disease": "Third most likely disease",
      "confidence": <number 0-100>,
      "treatment": "Detailed treatment",
      "prevention": "Prevention measures",
      "severity": "<low|medium|high>"
    }
  ]
}

Common aquaculture diseases to consider:
SHRIMP: White Spot Syndrome (WSSV), Early Mortality Syndrome (EMS/AHPND), Vibriosis, White Feces Disease (WFD), Infectious Hypodermal and Hematopoietic Necrosis (IHHNV), Taura Syndrome, Yellow Head Disease, Black Gill Disease, Loose Shell Syndrome, Enterocytozoon hepatopenaei (EHP), Monodon Baculovirus (MBV)
FISH: Epizootic Ulcerative Syndrome (EUS), Columnaris Disease, Ichthyophthirius (White Spot/Ich), Streptococcosis, Aeromonas infections, Gill Rot, Fin Rot, Dropsy, Saprolegniasis (Fungal infections), Viral Nervous Necrosis (VNN)

Guidelines:
- Rank diagnoses from most to least likely
- Confidence values should reflect realistic probability and sum should not exceed 150
- If symptoms are vague, give lower confidence and consider broader differentials
- Always recommend consulting a vet in treatment
- Be specific about medications, dosages, and water parameters in treatment
- Include biosecurity measures in prevention${langInstruction}`;

    // Build user message content
    const userContent: any[] = [];

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64 },
      });
      userContent.push({
        type: "text",
        text: `Analyze this image of an aquaculture specimen for disease identification.${symptoms ? ` Additional symptoms observed: ${symptoms}` : ""} Provide top 3 differential diagnoses. Respond with ONLY the JSON object.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Identify the top 3 most likely aquaculture diseases based on these symptoms: ${symptoms}. Respond with ONLY the JSON object.`,
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
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const diagnoses = (parsed.diagnoses || []).slice(0, 3).map((d: any) => ({
          disease: d.disease || "Unknown Disease",
          confidence: Math.min(100, Math.max(0, d.confidence || 50)),
          treatment: d.treatment || "Consult a qualified aquaculture veterinarian.",
          prevention: d.prevention || "Maintain optimal water quality and biosecurity.",
          severity: ["low", "medium", "high"].includes(d.severity) ? d.severity : "medium",
        }));

        if (diagnoses.length === 0) {
          throw new Error("No diagnoses parsed");
        }

        return new Response(
          JSON.stringify({ diagnoses }),
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
