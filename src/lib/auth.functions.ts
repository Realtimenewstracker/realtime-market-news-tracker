import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const USERNAME = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be under 24 characters")
  .regex(/^[a-zA-Z0-9_.]+$/, "Use letters, numbers, dot or underscore only");

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Is this username free? Used for inline signup validation. */
export const checkUsername = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ username: USERNAME }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", data.username)
      .maybeSingle();
    return { available: !row };
  });

/**
 * Sign in with either an email address or a username.
 * The username -> email lookup happens server-side so no address is ever
 * exposed to a caller that does not know the password.
 */
export const signInWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        identifier: z.string().trim().min(3).max(255),
        password: z.string().min(6).max(128),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    let email = data.identifier;

    if (!email.includes("@")) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("username", data.identifier)
        .maybeSingle();
      if (!profile) throw new Error("INVALID_CREDENTIALS");
      const { data: found, error } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      if (error || !found.user?.email) throw new Error("INVALID_CREDENTIALS");
      email = found.user.email;
    }

    const supabase = publicClient();
    const { data: res, error } = await supabase.auth.signInWithPassword({ email, password: data.password });
    if (error || !res.session) throw new Error("INVALID_CREDENTIALS");
    return {
      access_token: res.session.access_token,
      refresh_token: res.session.refresh_token,
    };
  });

/** Attach a username to the signed-in user's profile. */
export const claimUsername = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ username: USERNAME }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: taken } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", data.username)
      .maybeSingle();
    if (taken && taken.id !== context.userId) throw new Error("USERNAME_TAKEN");
    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: context.userId, username: data.username }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const myProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("id,username,display_name")
      .eq("id", context.userId)
      .maybeSingle();
    return data ?? null;
  });
