import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

// Lazy — read env inside handlers, not at module load.
function env(key: string): string {
  const v = (globalThis as any).process?.env?.[key] ?? Deno?.env?.get?.(key);
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

/** Anonymous client (RLS as `anon`) — used only for intentionally public reads. */
export function supabaseAnon() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Per-user client — RLS runs as the caller. */
export function supabaseForUser(ctx: ToolContext) {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_PUBLISHABLE_KEY"), {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Deno global typing shim
declare const Deno: { env: { get(k: string): string | undefined } } | undefined;
