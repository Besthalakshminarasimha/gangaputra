const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Indian fish market locations & species base prices (INR/kg)
const fishSpecies = [
  { name: 'Rohu', base: 220 },
  { name: 'Catla', base: 240 },
  { name: 'Mrigal', base: 200 },
  { name: 'Tilapia', base: 180 },
  { name: 'Pangasius (Basa)', base: 170 },
  { name: 'Pearl Spot (Karimeen)', base: 550 },
  { name: 'Seabass', base: 480 },
  { name: 'Pomfret', base: 700 },
  { name: 'Mackerel', base: 280 },
];

const markets = [
  { name: 'Kolkata', state: 'West Bengal', mod: 1.05 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', mod: 0.95 },
  { name: 'Chennai', state: 'Tamil Nadu', mod: 1.0 },
  { name: 'Mumbai', state: 'Maharashtra', mod: 1.15 },
  { name: 'Kochi', state: 'Kerala', mod: 1.1 },
  { name: 'Bhubaneswar', state: 'Odisha', mod: 0.92 },
  { name: 'Hyderabad', state: 'Telangana', mod: 1.02 },
  { name: 'Guwahati', state: 'Assam', mod: 1.08 },
];

function variation(seed: number) {
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * 21) - 10;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    const data = markets.map((m) => ({
      location: m.name,
      state: m.state,
      date: dateStr,
      dateISO: today.toISOString().split('T')[0],
      trend: variation(dateSeed + m.name.length) > 0 ? 'up' : 'down',
      lastUpdated: new Date().toISOString(),
      rates: fishSpecies.map((s, i) => ({
        species: s.name,
        rate_per_kg: Math.max(100, Math.round(s.base * m.mod + variation(dateSeed + i * 7 + m.name.length))),
      })),
    }));

    return new Response(JSON.stringify({ success: true, data, totalLocations: data.length, generatedAt: new Date().toISOString(), source: 'ai-estimated' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
