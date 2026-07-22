import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_health_reports",
  title: "List my aqua health reports",
  description: "List the signed-in user's saved aqua health / disease diagnosis reports.",
  inputSchema: { limit: z.number().int().min(1).max(100).default(25) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("health_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Returned ${data?.length ?? 0} health reports.` }],
      structuredContent: { reports: data ?? [] },
    };
  },
});
