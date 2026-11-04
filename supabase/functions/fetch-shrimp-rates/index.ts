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
    let requestedLocation: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.location !== undefined && (typeof body.location !== "string" || body.location.length > 100)) return json({ success: false, error: "Invalid market filter." }, 400);
        requestedLocation = typeof body?.location === "string" ? body.location.trim().toLocaleLowerCase() : null;
      } catch {
        return json({ success: false, error: "Invalid request body." }, 400);
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await db.from("shrimp_rates").select("location, count_range, date, rate_per_kg").lte("date", today).order("date", { ascending: false }).limit(3000);
    if (error) {
      console.error("Published shrimp rate query failed", error.message);
      return json({ success: false, error: "Could not load published shrimp prices." }, 503);
    }

    const latest = new Map<string, { location: string; count_range: string; date: string; rate_per_kg: number }>();
    for (const rate of data ?? []) {
      const key = `${rate.location.toLocaleLowerCase()}::${rate.count_range}`;
      if (!latest.has(key)) latest.set(key, rate);
    }
    const grouped = new Map<string, { location: string; date: string; rates: { count_range: string; rate_per_kg: number; date: string }[]; source: "admin-published" }>();
    for (const rate of latest.values()) {
      if (requestedLocation && !rate.location.toLocaleLowerCase().includes(requestedLocation)) continue;
      const group = grouped.get(rate.location) ?? { location: rate.location, date: rate.date, rates: [], source: "admin-published" as const };
      if (rate.date > group.date) group.date = rate.date;
      group.rates.push({ count_range: rate.count_range, rate_per_kg: rate.rate_per_kg, date: rate.date });
      grouped.set(rate.location, group);
    }
    const result = [...grouped.values()].map((market) => ({ ...market, rates: market.rates.sort((a, b) => Number(a.count_range) - Number(b.count_range)) }));
    return json({ success: true, data: result, totalLocations: result.length, source: "admin-published", unavailable: result.length === 0 });
  } catch (error) {
    console.error("Published shrimp prices unavailable", error);
    return json({ success: false, error: "Could not load published shrimp prices." }, 500);
  }
});