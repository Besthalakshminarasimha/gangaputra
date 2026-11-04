import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!url || !key) return json({ success: false, error: "Market rates are unavailable." }, 503);
    const db = createClient(url, key, { auth: { persistSession: false } });
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await db.from("fish_rates").select("species, location, state, date, rate_per_kg").lte("date", today).order("date", { ascending: false }).limit(3000);
    if (error) {
      console.error("Published fish rate query failed", error.message);
      return json({ success: false, error: "Could not load published fish prices." }, 503);
    }

    const latest = new Map<string, { species: string; location: string; state: string; date: string; rate_per_kg: number }>();
    for (const rate of data ?? []) {
      const key = `${rate.location.toLocaleLowerCase()}::${rate.species.toLocaleLowerCase()}`;
      if (!latest.has(key)) latest.set(key, rate);
    }
    const grouped = new Map<string, { location: string; state: string; date: string; rates: { species: string; rate_per_kg: number; date: string }[]; source: "admin-published" }>();
    for (const rate of latest.values()) {
      const key = `${rate.location}::${rate.state}`;
      const market = grouped.get(key) ?? { location: rate.location, state: rate.state, date: rate.date, rates: [], source: "admin-published" as const };
      if (rate.date > market.date) market.date = rate.date;
      market.rates.push({ species: rate.species, rate_per_kg: rate.rate_per_kg, date: rate.date });
      grouped.set(key, market);
    }
    const result = [...grouped.values()].map((market) => ({ ...market, rates: market.rates.sort((a, b) => a.species.localeCompare(b.species)) }));
    return json({ success: true, data: result, totalLocations: result.length, source: "admin-published", unavailable: result.length === 0 });
  } catch (error) {
    console.error("Published fish prices unavailable", error);
    return json({ success: false, error: "Could not load published fish prices." }, 500);
  }
});