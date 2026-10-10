import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayResponseHeaders, getLovableAiGatewayRunId } from "../_shared/aiGatewayRunId.ts";

const headers = { ...corsHeaders, "Access-Control-Allow-Headers": `${corsHeaders["Access-Control-Allow-Headers"]}, x-lovable-aig-run-id` };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
const MAX_REQUEST_SIZE = 7_500_000;
const ALLOWED_AGENT_IDS = new Set(["water-quality", "disease-detective", "feed-optimizer", "market-analyst", "pond-planner", "lab-assistant", "vet-advisor", "browser-agent"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (Number(req.headers.get("content-length") ?? 0) > MAX_REQUEST_SIZE) return json({ error: "Request is too large." }, 413);

  try {
    const token = (req.headers.get("Authorization") ?? "").match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return json({ error: "Sign in to use AI agents." }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!url || !anonKey) return json({ error: "Sign-in verification is unavailable." }, 500);
    const supabase = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Your sign-in has expired. Please sign in again." }, 401);

    const body = await req.json();
    const { messages, agentPrompt, agentId } = body;
    if (typeof agentPrompt !== "string" || !agentPrompt.trim() || agentPrompt.length > 12000) return json({ error: "The agent instructions are invalid." }, 400);
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 24) return json({ error: "The agent message is invalid." }, 400);
    if (typeof agentId !== "string" || !ALLOWED_AGENT_IDS.has(agentId)) return json({ error: "Unknown agent." }, 400);

    const input = messages.map((message: unknown) => {
      if (!message || typeof message !== "object") throw new Error("Invalid message.");
      const item = message as { role?: unknown; content?: unknown };
      if (item.role !== "user" && item.role !== "assistant") throw new Error("Invalid message role.");
      if (typeof item.content === "string") {
        if (item.content.length > 30000) throw new Error("A message is too long.");
        return { role: item.role, content: [{ type: "input_text", text: item.content }] };
      }
      if (!Array.isArray(item.content) || item.content.length > 8) throw new Error("Invalid multimodal message.");
      const content = item.content.map((part: unknown) => {
        if (!part || typeof part !== "object") throw new Error("Invalid message content.");
        const p = part as { type?: unknown; text?: unknown; image_url?: { url?: unknown } };
        if (p.type === "text" && typeof p.text === "string" && p.text.length <= 30000) return { type: "input_text", text: p.text };
        if (p.type === "image_url" && typeof p.image_url?.url === "string" && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(p.image_url.url) && p.image_url.url.length <= 7_000_000) return { type: "input_image", image_url: p.image_url.url };
        throw new Error("Image or text format is not supported.");
      });
      return { role: item.role, content };
    });

    let contextualPrompt = agentPrompt;
    if (agentId === "market-analyst") {
      const [shrimpResult, fishResult] = await Promise.all([
        supabase.from("shrimp_rates").select("location, count_range, date, rate_per_kg").lte("date", new Date().toISOString().slice(0, 10)).order("date", { ascending: false }).limit(500),
        supabase.from("fish_rates").select("species, location, state, date, rate_per_kg").lte("date", new Date().toISOString().slice(0, 10)).order("date", { ascending: false }).limit(500),
      ]);
      if (shrimpResult.error || fishResult.error) return json({ error: "Could not load published market rates. Please try again later." }, 503);
      const shrimp = new Map<string, { location: string; count_range: string; date: string; rate_per_kg: number }>();
      for (const rate of shrimpResult.data ?? []) {
        const key = `${rate.location.toLowerCase()}::${rate.count_range}`;
        if (!shrimp.has(key)) shrimp.set(key, rate);
      }
      const fish = new Map<string, { species: string; location: string; state: string; date: string; rate_per_kg: number }>();
      for (const rate of fishResult.data ?? []) {
        const key = `${rate.location.toLowerCase()}::${rate.species.toLowerCase()}`;
        if (!fish.has(key)) fish.set(key, rate);
      }
      contextualPrompt += `\n\nUse only this database snapshot for published market prices. Never invent prices or trends. If a matching price is missing, state that it is unavailable. Cite market and recorded date.\n${JSON.stringify({ shrimp: [...shrimp.values()], fish: [...fish.values()] })}`;
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI service is not configured." }, 500);
    const gateway = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
    const upstream = await gateway.fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST", signal: req.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: [{ role: "system", content: [{ type: "input_text", text: contextualPrompt + "\n\nProvide a comprehensive, actionable report using markdown. Clearly distinguish recorded facts from suggestions. Do not invent measurements, market prices, diagnoses, or results." }] }, ...input],
        stream: true, store: false, reasoning: { effort: "low", summary: "auto" }, include: ["reasoning.encrypted_content"],
      }),
    });
    if (!upstream.ok) {
      const safeMessage = (await upstream.text()).slice(0, 1000);
      console.error("AI gateway response", upstream.status, safeMessage);
      return new Response(JSON.stringify({ error: safeMessage || "The AI request could not be completed." }), { status: upstream.status, headers: getLovableAiGatewayResponseHeaders(upstream.headers, { ...headers, "Content-Type": "application/json" }) });
    }
    if (!upstream.body) return json({ error: "The AI service returned no response." }, 502);
    return new Response(upstream.body, { status: upstream.status, headers: getLovableAiGatewayResponseHeaders(upstream.headers, { ...headers, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" }) });
  } catch (error) {
    if (req.signal.aborted && error instanceof Error && error.name === "AbortError") return new Response(null, { status: 499, headers });
    console.error("AI agent request failed", error);
    return json({ error: error instanceof Error ? error.message : "Could not complete the AI request." }, 400);
  }
});
