import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admins only" }, 403);

    const { fileBase64, mimeType } = await req.json();
    if (!fileBase64 || typeof fileBase64 !== "string") return json({ error: "File is required" }, 400);
    if (fileBase64.length > 14_000_000) return json({ error: "File too large (max 10MB)" }, 400);

    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `Extract aquaculture market prices from the document. Only include prices that are explicitly printed. Never guess. Prices are INR per kg. If no date is printed, use ${today}. For shrimp, count_range is the count per kg (e.g. "30"). For fish, include species and state.` },
          { role: "user", content: [
            { type: "text", text: "Extract every shrimp and fish price in this document." },
            { type: "image_url", image_url: { url: `data:${mimeType || "application/pdf"};base64,${fileBase64}` } },
          ] },
        ],
        tools: [{ type: "function", function: {
          name: "report_rates",
          parameters: { type: "object", properties: {
            shrimp: { type: "array", items: { type: "object", properties: { location: { type: "string" }, count_range: { type: "string" }, date: { type: "string" }, rate_per_kg: { type: "number" } }, required: ["location", "count_range", "date", "rate_per_kg"] } },
            fish: { type: "array", items: { type: "object", properties: { species: { type: "string" }, location: { type: "string" }, state: { type: "string" }, date: { type: "string" }, rate_per_kg: { type: "number" } }, required: ["species", "location", "state", "date", "rate_per_kg"] } },
          }, required: ["shrimp", "fish"] },
        } }],
        tool_choice: { type: "function", function: { name: "report_rates" } },
      }),
    });
    if (res.status === 429) return json({ error: "Rate limited, try again shortly" }, 429);
    if (res.status === 402) return json({ error: "AI credits exhausted" }, 402);
    if (!res.ok) { console.error(await res.text()); return json({ error: "Could not analyze the file" }, 500); }
    const out = await res.json();
    const args = out.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { shrimp: [], fish: [] };
    return json({ shrimp: parsed.shrimp ?? [], fish: parsed.fish ?? [] });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
