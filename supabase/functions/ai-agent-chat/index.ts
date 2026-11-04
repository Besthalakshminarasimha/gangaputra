import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { GatewayError, streamChatCompletion } from "npm:@lovable.dev/ai-gateway";

const headers = corsHeaders;
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
    const chatMessages = [
      { role: "system" as const, content: contextualPrompt + "\n\nProvide a comprehensive, actionable report using markdown. Clearly distinguish recorded facts from suggestions. Do not invent measurements, market prices, diagnoses, or results." },
      ...input,
    ];
    const events = await streamChatCompletion({ model: "google/gemini-3.8-flash", messages: chatMessages }, { signal: req.signal, runId: req.headers.get("X-Lovable-AIG-Run-ID") ?? undefined });
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of events) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          if (error instanceof GatewayError) {
            console.error("AI gateway stream failure", error.toJSON());
            const frame = { type: "error", error: { message: error.message, code: error.code, httpStatus: error.httpStatus, outcome: error.outcome, recovery: error.recovery, remote: error.remote, ids: error.ids } };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
          } else {
            console.error("AI gateway stream failure", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: { message: "The AI response was interrupted." } })}\n\n`));
          }
          controller.close();
        }
      },
      cancel() {
        // The caller's request signal is forwarded to the SDK, which cancels local network I/O.
      },
    });
    const responseHeaders = new Headers(headers);
    responseHeaders.set("Content-Type", "text/event-stream");
    responseHeaders.set("Cache-Control", "no-cache");
    responseHeaders.set("Access-Control-Expose-Headers", "X-Lovable-AIG-Run-ID");
    if (events.runId) responseHeaders.set("X-Lovable-AIG-Run-ID", events.runId);
    return new Response(stream, { headers: responseHeaders });
  } catch (error) {
    if (req.signal.aborted && error instanceof Error && error.name === "AbortError") return new Response(null, { status: 499, headers });
    console.error("AI agent request failed", error);
    if (error instanceof GatewayError) return new Response(JSON.stringify({ error: error.message, code: error.code, recovery: error.recovery, ids: error.ids }), { status: error.httpStatus ?? 502, headers: { ...headers, "Content-Type": "application/json" } });
    return json({ error: error instanceof Error ? error.message : "Could not complete the AI request." }, 400);
  }
});
