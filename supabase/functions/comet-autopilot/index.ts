// In-app Autopilot planner: turns a user prompt into a sequence of UI actions
// the client can execute (navigate, scroll, click, fill, submit, wait, speak).
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const ROUTE_MAP = `
Available routes in this app (GANGAPUTRA aquaculture platform):
- /home               Landing/Home with hero, features, news, marketplace, testimonials
- /dashboard          User dashboard: shrimp & fish daily rates, news, price alerts, charts
- /farm               Farm management: water params, weather, disease predictor, doctors, ledger, loans
- /aquapedia          Knowledge hub: diseases, crop manuals, magazines, hatchery & medicine maps, community Q&A
- /calculators        Aeration, feeder, molarity, power factor, smart feed calculators
- /store              Ganga Store: product catalog, add to cart, checkout
- /orders             User's order history & cancellations
- /price-alerts       Price alert rules and history
- /jobs               Job portal: postings, profiles, chat, applications
- /ai-agents          AI agents hub (water, disease, feed, market, lab, vet, multi-tool, comet)
- /profile            User profile & notification preferences
- /faq                FAQ page

Common interactive elements (use button text or aria-label):
- Buttons: "Sign in", "Sign Out", "Add to Cart", "Buy Now", "Place Order", "Submit",
  "Sell Shrimp", "Sell Fish", "Run Agent", "Calculate", "Get Diagnosis", "Apply Now",
  "Send Message", "Book Appointment", "Save", "Cancel", "Add", "Search"
- Tabs: "Run Agent", "History", "Shrimp Rates", "Fish Rates"
- Inputs: by placeholder text or label (e.g. "Email", "Password", "Search products",
  "Pond size", "Stocking density", "Quantity (kg)", "Phone number")
`.trim();

const SYSTEM = `You are an autonomous in-app browser agent for the GANGAPUTRA aquaculture web app.
Convert the user's natural-language objective into an ordered list of UI actions the
client will execute. Be precise, minimal, and safe.

${ROUTE_MAP}

Rules:
- Use only the available action types in the schema.
- Prefer "navigate" before any action on a different route.
- For "click"/"fill" target elements by their visible text or placeholder when possible.
- Selectors: use simple CSS or text matching. Examples:
    "text=Add to Cart"            (matches a button/link whose text contains it)
    "placeholder=Email"           (matches an input by placeholder)
    "aria=Submit form"            (matches by aria-label)
    "[data-testid=foo]"           (raw CSS allowed)
- Insert short "wait" steps (300-1200ms) after navigate or click that opens dialogs.
- Use "submit" only when the user explicitly asked to place/send/confirm.
- Always end with a "speak" step summarising what was done.
- Keep total steps <= 15.`;

const TOOL = {
  type: "function",
  function: {
    name: "plan_actions",
    description: "Return the ordered action plan for the in-app agent to execute.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "One-sentence plan summary." },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["navigate", "scroll", "click", "fill", "submit", "wait", "speak"],
              },
              path: { type: "string", description: "For navigate: route path starting with /" },
              selector: { type: "string", description: "For scroll/click/fill/submit" },
              value: { type: "string", description: "For fill: the value to type" },
              ms: { type: "number", description: "For wait: milliseconds" },
              text: { type: "string", description: "For speak: message to user" },
              position: { type: "string", enum: ["top", "bottom"], description: "For scroll" },
              reason: { type: "string", description: "Why this step (1 short sentence)" },
              destructive: {
                type: "boolean",
                description: "True if step submits/places an order or sends data",
              },
            },
            required: ["type", "reason"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "actions"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const { objective, currentRoute } = await req.json();
    if (!objective || typeof objective !== "string" || objective.length < 3) {
      return new Response(JSON.stringify({ error: "Invalid objective" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMsg = `Current route: ${currentRoute || "/home"}\nObjective: ${objective.slice(0, 800)}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "plan_actions" } },
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      const status = r.status === 429 ? 429 : r.status === 402 ? 402 : 500;
      return new Response(
        JSON.stringify({
          error:
            status === 429
              ? "Rate limited, try again shortly."
              : status === 402
              ? "AI credits exhausted."
              : `AI gateway error: ${t.slice(0, 200)}`,
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await r.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("No plan returned");
    const plan = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("autopilot error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
