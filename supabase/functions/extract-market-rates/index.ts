import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { GatewayError, generateChatCompletion } from "npm:@lovable.dev/ai-gateway";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["shrimp", "fish"],
  properties: {
    shrimp: { type: "array", items: { type: "object", additionalProperties: false, required: ["location", "count_range", "date", "rate_per_kg"], properties: { location: { type: "string" }, count_range: { type: "string" }, date: { type: ["string", "null"] }, rate_per_kg: { type: "number" } } } },
    fish: { type: "array", items: { type: "object", additionalProperties: false, required: ["species", "location", "state", "date", "rate_per_kg"], properties: { species: { type: "string" }, location: { type: "string" }, state: { type: "string" }, date: { type: ["string", "null"] }, rate_per_kg: { type: "number" } } } },
  },
};

const validDate = (d: unknown) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const token = (req.headers.get("Authorization") ?? "").match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return json({ error: "Sign in as an admin." }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Your sign-in has expired." }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admins only" }, 403);

    const body = await req.json().catch(() => null);
    const documentText = body?.documentText;
    if (typeof documentText !== "string" || documentText.trim().length < 20) return json({ error: "No readable PDF text was received." }, 400);
    if (documentText.length > 160000) return json({ error: "The PDF text is too long." }, 400);

    const result = await generateChatCompletion({
      model: "google/gemini-3.8-flash",
      messages: [
        { role: "system", content: "Extract aquaculture market prices from the document text. Include only prices explicitly printed. Never guess or estimate. Prices are INR per kg. Use YYYY-MM-DD dates only when printed; otherwise date is null. For shrimp, count_range is count per kg (e.g. \"30\"). For fish include species and state (empty string if not printed). Return JSON." },
        { role: "user", content: documentText },
      ],
      response_format: { type: "json_schema", json_schema: { name: "market_rates", strict: true, schema } },
    }, { signal: req.signal });

    const text = result.choices?.[0]?.message?.content;
    const parsed = typeof text === "string" ? JSON.parse(text) : { shrimp: [], fish: [] };
    const shrimp = (parsed.shrimp ?? []).filter((r: any) => r.location && r.count_range && Number(r.rate_per_kg) > 0).map((r: any) => ({ location: String(r.location).trim(), count_range: String(r.count_range).trim(), date: validDate(r.date), rate_per_kg: Number(r.rate_per_kg) }));
    const fish = (parsed.fish ?? []).filter((r: any) => r.species && r.location && Number(r.rate_per_kg) > 0).map((r: any) => ({ species: String(r.species).trim(), location: String(r.location).trim(), state: String(r.state ?? "").trim(), date: validDate(r.date), rate_per_kg: Number(r.rate_per_kg) }));
    return json({ shrimp, fish });
  } catch (e) {
    console.error("Market rate extraction failed", e instanceof GatewayError ? e.toJSON() : e);
    if (e instanceof GatewayError) return json({ error: e.message }, e.httpStatus ?? 502);
    return json({ error: e instanceof Error ? e.message : "Could not analyze the PDF." }, 500);
  }
});
