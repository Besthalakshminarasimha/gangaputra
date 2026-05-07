import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function firecrawlScrape(url: string) {
  if (!FIRECRAWL_API_KEY) throw new Error('Firecrawl not configured');
  const r = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || `Firecrawl ${r.status}`);
  return data?.data?.markdown || data?.markdown || '';
}

async function firecrawlSearch(query: string, limit = 5) {
  if (!FIRECRAWL_API_KEY) throw new Error('Firecrawl not configured');
  const r = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || `Firecrawl ${r.status}`);
  return data?.data || data;
}

async function summarize(text: string, instruction: string) {
  if (!LOVABLE_API_KEY) throw new Error('AI not configured');
  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a research assistant for aquaculture farmers. Be concise, structured, actionable.' },
        { role: 'user', content: `${instruction}\n\nContent:\n${text.slice(0, 12000)}` },
      ],
    }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || 'AI failed');
  return d.choices?.[0]?.message?.content || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !userData.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const user = userData.user;

    const { tool, params } = await req.json();

    if (tool === 'scrape') {
      const md = await firecrawlScrape(params.url);
      const summary = params.summarize ? await summarize(md, params.instruction || 'Summarize key points for an aquaculture farmer.') : null;
      return new Response(JSON.stringify({ success: true, markdown: md.slice(0, 5000), summary }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (tool === 'search') {
      const results = await firecrawlSearch(params.query, params.limit || 5);
      return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (tool === 'schedule_task') {
      const { data, error } = await supabase
        .from('agent_scheduled_tasks')
        .insert({
          user_id: user.id,
          title: params.title,
          description: params.description || null,
          due_date: params.due_date || null,
          email_recipient: params.email_recipient || null,
          source: params.source || 'agent',
        })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, task: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (tool === 'list_tasks') {
      const { data, error } = await supabase
        .from('agent_scheduled_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      const total = data?.length || 0;
      const pending = data?.filter((t: any) => !t.completed).length || 0;
      return new Response(JSON.stringify({ success: true, tasks: data, total, pending, completed: total - pending }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (tool === 'send_email') {
      // Use Resend directly since RESEND_API_KEY is configured
      const RESEND = Deno.env.get('RESEND_API_KEY');
      if (!RESEND) throw new Error('Email not configured');
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Gangaputra <onboarding@resend.dev>',
          to: [params.to],
          subject: params.subject,
          html: params.html || `<p>${params.text || ''}</p>`,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.message || 'Email send failed');
      return new Response(JSON.stringify({ success: true, id: d.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown tool' }), { status: 400, headers: corsHeaders });
  } catch (e) {
    console.error('multi-tool-agent error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
