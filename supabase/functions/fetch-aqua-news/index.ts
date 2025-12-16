const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    console.log('Fetching aquaculture news for:', today);

    const prompt = `You are an aquaculture news reporter. Generate 6 realistic and informative news articles about aquaculture, shrimp farming, fish farming, and related topics in India. These should sound like real news from today (${today}).

For each news item, provide:
1. A compelling headline
2. A brief summary (2-3 sentences)
3. The source (use realistic Indian news sources like The Hindu, Economic Times, Fishing Chimes, Aqua International, Down To Earth, etc.)
4. A category (one of: Market Update, Technology, Disease Alert, Policy, Weather, Export, Research)

Format your response as a valid JSON array with exactly 6 objects. Each object should have these exact fields:
- "id": unique number (1-6)
- "title": headline string
- "summary": brief description string
- "source": news source name string
- "category": category string
- "date": "${today}"

Topics to cover:
- Shrimp prices and market trends in Andhra Pradesh/Tamil Nadu
- New aquaculture technology or equipment
- Disease management updates (EHP, WSSV, etc.)
- Government policies or subsidies for farmers
- Weather impacts on farming
- Export market updates

Return ONLY the JSON array, no additional text or markdown formatting.`;

    const response = await fetch('https://llm-proxy.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch news' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ success: false, error: 'No content received' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from the response
    let newsItems;
    try {
      // Clean the response - remove any markdown formatting if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      newsItems = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse news JSON:', parseError);
      console.error('Raw content:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse news data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully fetched', newsItems.length, 'news items');

    return new Response(
      JSON.stringify({ success: true, news: newsItems, fetchedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch news' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
