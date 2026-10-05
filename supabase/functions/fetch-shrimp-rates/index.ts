const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'npm:@supabase/supabase-js@2';

// Indian shrimp market locations with base prices
const marketLocations = [
  { name: "Bhimavaram", state: "Andhra Pradesh", basePrice: 350 },
  { name: "Nellore", state: "Andhra Pradesh", basePrice: 345 },
  { name: "Kakinada", state: "Andhra Pradesh", basePrice: 340 },
  { name: "Ongole", state: "Andhra Pradesh", basePrice: 348 },
  { name: "Machilipatnam", state: "Andhra Pradesh", basePrice: 342 },
  { name: "Chennai", state: "Tamil Nadu", basePrice: 360 },
  { name: "Nagapattinam", state: "Tamil Nadu", basePrice: 355 },
  { name: "Tuticorin", state: "Tamil Nadu", basePrice: 352 },
  { name: "Veraval", state: "Gujarat", basePrice: 365 },
  { name: "Porbandar", state: "Gujarat", basePrice: 362 },
  { name: "Kolkata", state: "West Bengal", basePrice: 370 },
  { name: "Kakdwip", state: "West Bengal", basePrice: 358 },
  { name: "Paradip", state: "Odisha", basePrice: 350 },
  { name: "Chilika", state: "Odisha", basePrice: 348 },
  { name: "Kochi", state: "Kerala", basePrice: 375 },
];

// Count ranges for shrimp
const countRanges = ["20", "30", "40", "50", "60", "70", "80", "90", "100"];

// Generate price variation based on date seed
function generateDailyVariation(seed: number): number {
  // Create a pseudo-random variation between -15 and +15
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * 31) - 15;
}

// Generate rates for a specific location
function generateRatesForLocation(location: typeof marketLocations[0], dateSeed: number) {
  const locationSeed = location.name.length + dateSeed;
  const dailyVariation = generateDailyVariation(locationSeed);
  
  return countRanges.map((count, index) => {
    // Price decreases as count increases (smaller shrimp = lower price)
    const countFactor = (9 - index) * 20; // Higher counts get lower prices
    const baseForCount = location.basePrice + countFactor;
    
    // Add daily variation
    const rate = baseForCount + dailyVariation + generateDailyVariation(locationSeed + index * 7);
    
    return {
      count_range: count,
      rate_per_kg: Math.max(150, Math.min(550, rate)), // Keep within reasonable bounds
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Create a seed based on the date
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    console.log('Generating shrimp rates for:', dateStr);

    // Parse request body for optional location filter
    let requestedLocation: string | null = null;
    try {
      const body = await req.json();
      requestedLocation = body?.location || null;
    } catch {
      // No body or invalid JSON, use all locations
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
    const db = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
    const { data: publishedRates } = db
      ? await db.from('shrimp_rates').select('location, count_range, date, rate_per_kg').lte('date', today.toISOString().split('T')[0]).order('date', { ascending: false }).limit(1000)
      : { data: [] };
    const latestPublished = new Map<string, { rate_per_kg: number; date: string }>();
    for (const published of publishedRates || []) {
      const key = `${published.location.toLowerCase()}::${published.count_range}`;
      if (!latestPublished.has(key)) latestPublished.set(key, { rate_per_kg: published.rate_per_kg, date: published.date });
    }

    // Generate rates for all locations or specific location, then overlay admin-published values.
    const rates: any[] = [];
    
    const locationsToProcess = requestedLocation 
      ? marketLocations.filter(loc => 
          loc.name.toLowerCase() === requestedLocation?.toLowerCase() ||
          loc.state.toLowerCase() === requestedLocation?.toLowerCase()
        )
      : marketLocations;

    for (const location of locationsToProcess) {
      const generatedRates = generateRatesForLocation(location, dateSeed);
      const locationRates = generatedRates.map((rate) => {
        const published = latestPublished.get(`${location.name.toLowerCase()}::${rate.count_range}`);
        return published ? { ...rate, rate_per_kg: published.rate_per_kg } : rate;
      });
      const hasPublishedRate = locationRates.some((rate, index) => rate.rate_per_kg !== generatedRates[index]?.rate_per_kg);
      
      rates.push({
        location: location.name,
        state: location.state,
        date: dateStr,
        dateISO: today.toISOString().split('T')[0],
        rates: locationRates,
        trend: generateDailyVariation(dateSeed + location.name.length) > 0 ? 'up' : 'down',
        lastUpdated: new Date().toISOString(),
        source: hasPublishedRate ? 'admin-published' : 'ai-estimated'
      });
    }

    console.log('Generated rates for', rates.length, 'locations');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: rates, 
        totalLocations: rates.length,
        generatedAt: new Date().toISOString(),
        source: rates.some((rate) => rate.source === 'admin-published') ? 'admin-published' : 'ai-estimated'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating shrimp rates:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate rates' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
