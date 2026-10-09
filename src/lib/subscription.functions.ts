import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlanId = "monthly" | "yearly";

export const PLANS: Record<PlanId, { id: PlanId; label: string; amount: number; per: string; note: string }> = {
  monthly: { id: "monthly", label: "Monthly", amount: 199, per: "month", note: "Billed every month" },
  yearly: { id: "yearly", label: "Yearly", amount: 1800, per: "year", note: "Save ₹588 vs monthly" },
};

export type SubscriptionState = {
  plan: string;
  status: string;
  trial_ends_at: string;
  current_period_end: string | null;
  active: boolean;
  in_trial: boolean;
  days_left: number;
};

function shape(row: {
  plan: string;
  status: string;
  trial_ends_at: string;
  current_period_end: string | null;
}): SubscriptionState {
  const now = Date.now();
  const trialEnd = new Date(row.trial_ends_at).getTime();
  const periodEnd = row.current_period_end ? new Date(row.current_period_end).getTime() : 0;
  const in_trial = row.status === "trialing" && trialEnd > now;
  const paid = row.status === "active" && periodEnd > now;
  const end = paid ? periodEnd : trialEnd;
  return {
    plan: row.plan,
    status: row.status,
    trial_ends_at: row.trial_ends_at,
    current_period_end: row.current_period_end,
    // Free access is enabled until paid membership is explicitly launched.
    active: true,
    in_trial,
    days_left: Math.max(0, Math.ceil((end - now) / 86_400_000)),
  };
}

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionState> => {
    const { data } = await context.supabase
      .from("subscriptions")
      .select("plan,status,trial_ends_at,current_period_end")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (data) return shape(data);

    // Older accounts created before subscriptions existed.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({ user_id: context.userId })
      .select("plan,status,trial_ends_at,current_period_end")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Could not load membership");
    return shape(created);
  });

/**
 * Payments are not connected. Save a member's planned launch-price preference
 * for demand research; this must never grant paid access.
 */
export const savePlanInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ plan: z.enum(["monthly", "yearly"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        { user_id: context.userId, plan: data.plan, amount_inr: PLANS[data.plan].amount },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, pending: true as const, plan: data.plan, amount: PLANS[data.plan].amount };
  });
