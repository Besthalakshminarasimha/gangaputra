import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_shrimp_rates",
  title: "Get daily shrimp rates",
  description:
    "Fetch the latest per-count shrimp rates across Indian markets (Vannamei / Tiger / Black Tiger). Returns rows sorted by newest first.",
  inputSchema: {
    market: z.string().optional().describe("Optional market filter, e.g. 'Vijayawada', 'Nellore'."),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ market, limit }) => {
    const sb = supabaseAnon();
    let q = sb.from("shrimp_rates").select("*").order("created_at", { ascending: false }).limit(limit);
    if (market) q = q.ilike("market", `%${market}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Returned ${data?.length ?? 0} shrimp rate rows.` }],
      structuredContent: { rates: data ?? [] },
    };
  },
});
