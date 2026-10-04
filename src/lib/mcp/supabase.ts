import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import type { Database } from "@/integrations/supabase/types";

export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("An account connection is required.");
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Market data connection is unavailable.");
  return createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers, signal: ctx.signal });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireActiveMember(ctx: ToolContext) {
  const userId = ctx.getUserId();
  if (!userId) throw new Error("An account connection is required.");
  const db = supabaseForUser(ctx);
  // Access remains account-scoped through RLS, but is free regardless of the old trial date.
  return { db, userId };
}