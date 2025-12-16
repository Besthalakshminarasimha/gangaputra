const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate news based on date to ensure daily variation
function generateDailyNews(date: Date): any[] {
  const day = date.getDate();
  const month = date.getMonth();
  const dateStr = date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const newsPool = [
    // Market Updates
    {
      id: 1,
      title: "Shrimp Prices Rise in Andhra Pradesh Markets",
      summary: "Vannamei shrimp prices have increased by ₹15-20 per kg across major markets in Andhra Pradesh due to increased export demand. Farmers are advised to plan harvests accordingly.",
      source: "Fishing Chimes",
      category: "Market Update",
      date: dateStr
    },
    {
      id: 2,
      title: "Export Demand Boosts Aquaculture Sector",
      summary: "Indian seafood exports reach new highs as international buyers show increased interest in Indian vannamei shrimp. Processing plants operating at full capacity.",
      source: "Economic Times",
      category: "Export",
      date: dateStr
    },
    {
      id: 3,
      title: "New Biofloc Technology Center Opens in Vijayawada",
      summary: "State government inaugurates advanced biofloc training facility to help farmers adopt sustainable aquaculture practices. Free training available for registered farmers.",
      source: "The Hindu",
      category: "Technology",
      date: dateStr
    },
    {
      id: 4,
      title: "EHP Alert: Preventive Measures for Shrimp Farmers",
      summary: "MPEDA issues advisory on Enterocytozoon hepatopenaei (EHP) prevention. Farmers urged to source SPF seeds and maintain strict biosecurity protocols.",
      source: "Aqua International",
      category: "Disease Alert",
      date: dateStr
    },
    {
      id: 5,
      title: "Government Announces New Subsidies for Small Farmers",
      summary: "Central government allocates ₹500 crore for aquaculture development. Small and marginal farmers eligible for 40% subsidy on pond construction and equipment.",
      source: "Down To Earth",
      category: "Policy",
      date: dateStr
    },
    {
      id: 6,
      title: "Weather Advisory: Cyclone Alert for Coastal Areas",
      summary: "IMD predicts low pressure system developing in Bay of Bengal. Coastal aqua farmers advised to take precautionary measures and strengthen pond embankments.",
      source: "The Hindu",
      category: "Weather",
      date: dateStr
    },
    {
      id: 7,
      title: "CIBA Releases New Disease-Resistant Shrimp Variety",
      summary: "Central Institute of Brackishwater Aquaculture develops new shrimp variety with improved WSSV resistance. Field trials show 20% better survival rates.",
      source: "Aqua International",
      category: "Research",
      date: dateStr
    },
    {
      id: 8,
      title: "Fish Feed Prices Stabilize After Recent Volatility",
      summary: "Major feed manufacturers announce stable pricing for Q4. Soybean meal availability improves, easing pressure on production costs for farmers.",
      source: "Fishing Chimes",
      category: "Market Update",
      date: dateStr
    },
    {
      id: 9,
      title: "Smart Farming: IoT Adoption Grows Among Aqua Farmers",
      summary: "More farmers adopting automated feeding systems and water quality monitors. Technology helps reduce FCR and improve overall productivity by 15-20%.",
      source: "Economic Times",
      category: "Technology",
      date: dateStr
    },
    {
      id: 10,
      title: "Tamil Nadu Launches Aquaculture Insurance Scheme",
      summary: "State fisheries department introduces comprehensive insurance coverage for shrimp and fish farmers. Premium subsidy of 50% for first-time beneficiaries.",
      source: "The Hindu",
      category: "Policy",
      date: dateStr
    },
    {
      id: 11,
      title: "Vibriosis Cases Reported in Krishna District",
      summary: "Local aquaculture department confirms vibriosis outbreak in select ponds. Farmers advised to improve water quality and consult with fisheries officers.",
      source: "Aqua International",
      category: "Disease Alert",
      date: dateStr
    },
    {
      id: 12,
      title: "USA Increases Shrimp Import Quota from India",
      summary: "American seafood importers boost orders from Indian suppliers. Compliance with antibiotic-free certification drives premium pricing for exporters.",
      source: "Economic Times",
      category: "Export",
      date: dateStr
    }
  ];

  // Use date to select different news each day
  const seed = day + month * 31;
  const shuffled = [...newsPool].sort((a, b) => {
    const hashA = (a.id * seed) % 100;
    const hashB = (b.id * seed) % 100;
    return hashA - hashB;
  });

  // Return 6 news items
  return shuffled.slice(0, 6).map((news, idx) => ({
    ...news,
    id: idx + 1
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date();
    console.log('Generating aquaculture news for:', today.toLocaleDateString('en-IN'));

    const newsItems = generateDailyNews(today);

    console.log('Successfully generated', newsItems.length, 'news items');

    return new Response(
      JSON.stringify({ success: true, news: newsItems, fetchedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating news:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate news' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
