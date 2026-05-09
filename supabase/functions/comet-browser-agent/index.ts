import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  objective: string;
}

interface SearchResult {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
}

async function firecrawlSearch(query: string, apiKey: string): Promise<SearchResult[]> {
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 6,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Firecrawl search failed [${res.status}]: ${t.slice(0, 300)}`);
  }
  const json = await res.json();
  return (json?.data ?? []) as SearchResult[];
}

async function synthesize(objective: string, results: SearchResult[], lovableKey: string): Promise<string> {
  const sources = results
    .map((r, i) => {
      const body = (r.markdown ?? r.description ?? "").slice(0, 3500);
      return `### Source [${i + 1}] ${r.title ?? r.url}\nURL: ${r.url}\n\n${body}`;
    })
    .join("\n\n---\n\n");

  const prompt = `Objective: ${objective}\n\nYou browsed the web and collected the sources below. Produce a comprehensive, actionable report for an Indian aquaculture farmer.\n\nFormatting:\n- Markdown with clear ## headings\n- Bullet points with concrete numbers, prices, names, dates, contacts\n- A short \"Key Takeaways\" section at the top\n- A \"Recommended Actions\" section at the end\n- Cite sources inline like [1], [2] matching their numbers below\n\nSOURCES:\n${sources}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are the Comet Browser Agent for Gangaputra, an aquaculture platform. You synthesize live web research into precise, actionable reports for Indian shrimp/fish farmers.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Lovable AI failed [${res.status}]: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "(empty response)";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
      return new Response(JSON.stringify({ error: "Unauthorized — please sign in" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = (await req.json()) as RequestBody;
    if (!body.objective || typeof body.objective !== "string" ||
        body.objective.trim().length < 3 || body.objective.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Objective must be a string between 3 and 1000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!FIRECRAWL_API_KEY || !LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Browser agent not configured (missing keys)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: task, error: insertError } = await supabase
      .from("comet_agent_tasks")
      .insert({ user_id: userId, objective: body.objective, status: "running" })
      .select()
      .single();

    if (insertError || !task) {
      return new Response(JSON.stringify({ error: "Failed to create task record" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      console.log(`[comet] searching: ${body.objective}`);
      const results = await firecrawlSearch(body.objective, FIRECRAWL_API_KEY);
      console.log(`[comet] got ${results.length} results, synthesizing...`);

      const citations = results.map((r) => r.url).filter(Boolean);
      let content: string;
      if (results.length === 0) {
        content = `No live web results were found for: **${body.objective}**.\n\nTry a more specific query.`;
      } else {
        content = await synthesize(body.objective, results, LOVABLE_API_KEY);
      }

      await supabase.from("comet_agent_tasks")
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
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[comet] error:", message);
      await supabase.from("comet_agent_tasks")
        .update({ status: "failed", error: message })
        .eq("id", task.id);
      return new Response(JSON.stringify({ error: message, taskId: task.id }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("comet-browser-agent error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
