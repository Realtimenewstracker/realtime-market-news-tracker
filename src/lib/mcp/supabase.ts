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
  const db = supabaseForUser(ctx);
  const { data, error } = await db.from("subscriptions")
    .select("status,trial_ends_at,current_period_end")
    .eq("user_id", ctx.getUserId()).maybeSingle();
  if (error) throw new Error("Membership status is unavailable.");
  const now = Date.now();
  if (!data || !(
    (data.status === "trialing" && new Date(data.trial_ends_at).getTime() > now) ||
    (data.status === "active" && data.current_period_end && new Date(data.current_period_end).getTime() > now)
  )) throw new Error("An active trial or subscription is required.");
  return db;
}