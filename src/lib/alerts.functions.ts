import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("alerts")
      .select("id,kind,subject,title,body,direction,change_pct,article_id,is_read,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markAlertsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).max(100).nullable().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("alerts").update({ is_read: true }).eq("is_read", false);
    if (data.ids?.length) q = q.in("id", data.ids);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("alerts")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const settingsSchema = z.object({
  price_enabled: z.boolean(),
  news_enabled: z.boolean(),
  ipo_announce_enabled: z.boolean(),
  price_threshold_pct: z.number().min(0.1).max(25),
  min_impact: z.number().int().min(0).max(3),
});

export type AlertSettings = z.infer<typeof settingsSchema>;

// The generated database types may not list ipo_announce_enabled yet, so read it loosely.
type SettingsRow = {
  price_enabled: boolean;
  news_enabled: boolean;
  price_threshold_pct: number | string;
  min_impact: number;
  ipo_announce_enabled?: boolean | null;
};

export const getAlertSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlertSettings> => {
    const { data, error } = await context.supabase
      .from("alert_settings")
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    const row = data as unknown as SettingsRow | null;
    return {
      price_enabled: row?.price_enabled ?? true,
      news_enabled: row?.news_enabled ?? true,
      ipo_announce_enabled: row?.ipo_announce_enabled ?? false,
      price_threshold_pct: Number(row?.price_threshold_pct ?? 2),
      min_impact: row?.min_impact ?? 3,
    };
  });

export const saveAlertSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("alert_settings")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("alerts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
