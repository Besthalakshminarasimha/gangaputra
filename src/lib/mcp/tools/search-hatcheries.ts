import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_hatcheries",
  title: "Search hatcheries & aqua stores",
  description: "Search the hatchery / aqua-store directory by name or city.",
  inputSchema: {
    query: z.string().optional(),
    city: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, city, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    let q = sb.from("hatcheries").select("*").limit(limit);
    if (query) q = q.ilike("name", `%${query}%`);
    if (city) q = q.ilike("city", `%${city}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Found ${data?.length ?? 0} hatcheries.` }],
      structuredContent: { hatcheries: data ?? [] },
    };
  },
});
