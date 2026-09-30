import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PLANS, startCheckout, type PlanId } from "@/lib/subscription.functions";
import { useSubscription } from "@/hooks/use-subscription";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — TrackIndia membership" },
      {
        name: "description",
        content:
          "Start with 7 days free, then ₹199 per month or ₹1800 per year for live Indian market news, IPO tracking, policy tracking and alerts.",
      },
      { property: "og:title", content: "Pricing — TrackIndia membership" },
      {
        property: "og:description",
        content: "7 days free, then ₹199/month or ₹1800/year for the TrackIndia live market tape.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const FEATURES = [
  "Real-time AI-tagged news for NSE, BSE and global markets",
  "IPO tracker with heat scores and watchlist",
  "Government policy tracker with beneficiary companies",
  "Price and news alerts for your watchlist",
  "Geopolitics board and portfolio tracking",
];

function PricingPage() {
  const router = useRouter();
  const { subscription, signedIn } = useSubscription();
  const checkout = useServerFn(startCheckout);
  const [busy, setBusy] = useState<PlanId | null>(null);

  const choose = async (plan: PlanId) => {
    if (!signedIn) {
      router.navigate({ to: "/auth" });
      return;
    }
    setBusy(plan);
    try {
      await checkout({ data: { plan } });
       toast.success("Plan preference saved", {
         description: "Payment is not available yet. This does not activate a subscription.",
       });
    } catch {
      toast.error("Could not save your plan. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-3 md:px-8 pt-8 pb-28">
      <div className="text-center">
        <span className="glass-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
          <Sparkles size={12} /> 7 days free
        </span>
        <h1 className="mt-4 font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          Simple membership
        </h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
           Every new account gets 7 days free. Payment is not available yet; these are the planned subscription prices.
        </p>
        {subscription && (
          <p className="mt-3 text-xs text-muted-foreground">
            {subscription.in_trial
              ? `Your free trial ends in ${subscription.days_left} day${subscription.days_left === 1 ? "" : "s"}.`
              : subscription.active
                ? `Your ${subscription.plan} plan is active.`
                : "Your free trial has ended."}
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {(["monthly", "yearly"] as PlanId[]).map((id) => {
          const p = PLANS[id];
          return (
            <div key={id} className="glass-strong rounded-3xl p-6 flex flex-col">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-foreground">{p.label}</h2>
                {id === "yearly" && (
                  <span className="glass-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest">
                    Best value
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-end gap-1">
                <span className="font-mono text-4xl font-semibold text-foreground">₹{p.amount}</span>
                <span className="pb-1 text-sm text-muted-foreground">/ {p.per}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
              <ul className="mt-5 space-y-2 text-sm text-foreground/80">
                {FEATURES.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-bull" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(id)}
                disabled={busy === id}
                className="mt-6 w-full rounded-full glass-btn-primary px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {busy === id ? "…" : signedIn ? `Choose ${p.label.toLowerCase()}` : "Start free trial"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
         Cashfree payment is planned but not connected. Saving a plan does not charge you or extend access after the trial.
      </p>
      <div className="mt-6 text-center">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to the tape
        </Link>
      </div>
    </section>
  );
}
