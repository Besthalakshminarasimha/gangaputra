import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "schedule_task",
  title: "Schedule a task",
  description:
    "Add a task to the signed-in user's in-app calendar (agent_scheduled_tasks). Use for reminders like water testing, feeding, harvest, or follow-ups.",
  inputSchema: {
    title: z.string().min(1),
    description: z.string().optional(),
    due_date: z.string().optional().describe("ISO 8601 datetime, e.g. 2026-07-25T09:00:00Z"),
    email_recipient: z.string().email().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ title, description, due_date, email_recipient }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("agent_scheduled_tasks")
      .insert({
        user_id: ctx.getUserId(),
        title,
        description: description ?? null,
        due_date: due_date ?? null,
        email_recipient: email_recipient ?? null,
        source: "mcp",
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Scheduled task "${title}".` }],
      structuredContent: { task: data },
    };
  },
});
