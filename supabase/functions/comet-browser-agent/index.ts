import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  objective: string;
  taskId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("Auth failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized — please sign in to use the Comet agent" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Validate input
    const body = (await req.json()) as RequestBody;
    if (
      !body.objective || typeof body.objective !== "string" ||
      body.objective.trim().length < 3 || body.objective.length > 1000
    ) {
      return new Response(
        JSON.stringify({
          error: "Objective must be a string between 3 and 1000 characters",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const COMET_API_KEY = Deno.env.get("COMET_API_KEY");
    if (!COMET_API_KEY) {
      return new Response(
        JSON.stringify({ error: "COMET_API_KEY is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create task record (status: running)
    const { data: task, error: insertError } = await supabase
      .from("comet_agent_tasks")
      .insert({
        user_id: userId,
        objective: body.objective,
        status: "running",
      })
      .select()
      .single();

    if (insertError || !task) {
      console.error("Failed to create task:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create task record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Call Perplexity (Comet) API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    try {
      const pplxRes = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${COMET_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content:
                "You are the Comet Browser Agent for Gangaputra, an aquaculture platform for Indian shrimp/fish farmers. Browse the web and return concise, actionable, well-structured findings. Use markdown headings, bullet points, and include specific numbers, prices, contacts, and dates when relevant.",
            },
            { role: "user", content: body.objective },
          ],
        }),
      });
      clearTimeout(timeout);

      if (!pplxRes.ok) {
        const errText = await pplxRes.text();
        await supabase
          .from("comet_agent_tasks")
          .update({
            status: "failed",
            error: `Comet API error [${pplxRes.status}]: ${errText.slice(0, 500)}`,
          })
          .eq("id", task.id);
        return new Response(
          JSON.stringify({
            error: "Comet API request failed",
            status: pplxRes.status,
            taskId: task.id,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const data = await pplxRes.json();
      const content: string = data?.choices?.[0]?.message?.content ?? "";
      const citations: string[] = data?.citations ?? data?.search_results?.map((r: any) => r.url) ?? [];

      await supabase
        .from("comet_agent_tasks")
        .update({ status: "completed", result: content, citations })
        .eq("id", task.id);

      return new Response(
        JSON.stringify({
          taskId: task.id,
          objective: body.objective,
          result: content,
          citations,
          status: "completed",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (err) {
      clearTimeout(timeout);
      const message = err instanceof Error ? err.message : "Unknown error";
      await supabase
        .from("comet_agent_tasks")
        .update({ status: "failed", error: message })
        .eq("id", task.id);
      return new Response(
        JSON.stringify({ error: message, taskId: task.id }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("comet-browser-agent error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
