import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_fish_rates",
  title: "Get daily fish rates",
  description:
    "Fetch the latest admin-published fish market rates by species and location.",
  inputSchema: {
    species: z.string().optional().describe("Optional species filter, e.g. 'Rohu', 'Katla'."),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ species, limit }) => {
    const sb = supabaseAnon();
    let q = sb.from("fish_rates").select("*").order("date", { ascending: false }).limit(limit);
    if (species) q = q.ilike("species", `%${species}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Returned ${data?.length ?? 0} rate rows.` }],
      structuredContent: { rates: data ?? [] },
    };
  },
});
