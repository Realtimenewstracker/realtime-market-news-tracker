import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PLANS, savePlanInterest, type PlanId } from "@/lib/subscription.functions";
import { useSubscription } from "@/hooks/use-subscription";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "TrackIndia Pro early access" },
      {
        name: "description",
        content:
          "Explore the planned TrackIndia Pro briefing and alerts. TrackIndia is free today; payment is not available yet.",
      },
      { property: "og:title", content: "TrackIndia Pro early access" },
      {
        property: "og:description",
        content:
          "Help shape a personalized market briefing and watchlist alerts. No payment is available or taken today.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const FREE_FEATURES = [
  "Browse market headlines with links to their sources",
  "Explore IPO, policy, geopolitics, crypto and commodities coverage",
  "Create multiple named watchlists and receive in-app price, news and IPO alerts after sign-in",
  "Import portfolio holdings from a CSV file",
  "Opt in to browser notifications for new alerts while TrackIndia is open",
  "Read AI summaries with clearly marked sentiment and impact estimates",
];

const PRO_FEATURES = [
  "A scheduled daily briefing with more control over timing and topics",
  "Advanced price, news and event alert rules with background push delivery",
  "Broader company and fundamentals coverage after data access is confirmed",
  "Saved research collections with source links and change history",
];

function PricingPage() {
  const router = useRouter();
  const { signedIn } = useSubscription();
  const saveInterest = useServerFn(savePlanInterest);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
  const [busy, setBusy] = useState(false);

  const joinEarlyAccess = async () => {
    if (!signedIn) {
      router.navigate({ to: "/auth", search: { next: "/pricing" } });
      return;
    }

    setBusy(true);
    try {
      await saveInterest({ data: { plan: selectedPlan } });
      toast.success("Pro interest saved", {
        description: "Your account stays free. You will not be charged.",
      });
    } catch {
      toast.error("Could not save your preference. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const plan = PLANS[selectedPlan];

  return (
    <section className="max-w-5xl mx-auto px-3 md:px-8 pt-8 pb-28">
      <div className="text-center max-w-2xl mx-auto">
        <span className="glass-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
          <Sparkles size={12} /> Pro early access
        </span>
        <h1 className="mt-4 font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          Follow your market, not every headline
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground">
          TrackIndia is free today. We are shaping a future Pro plan around a personal market briefing,
          useful watchlist alerts and clear links back to the source.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Pro features and prices are being tested. Payment is not available yet.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass rounded-3xl p-6 flex flex-col">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Available now
          </div>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Free access</h2>
          <div className="mt-3 flex items-end gap-1">
            <span className="font-mono text-4xl font-semibold text-foreground">₹0</span>
            <span className="pb-1 text-sm text-muted-foreground">today</span>
          </div>
          <ul className="mt-5 space-y-3 text-sm text-foreground/80">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-bull" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {!signedIn && (
            <Link
              to="/auth"
              search={{ next: "/pricing" }}
              className="mt-6 w-full rounded-full glass-btn px-4 py-2.5 text-center text-sm font-semibold"
            >
              Create a free account
            </Link>
          )}
        </div>

        <div className="glass-strong rounded-3xl p-6 flex flex-col ring-1 ring-primary/20">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">
              Planned · not available yet
            </div>
            <span className="glass-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest">
              Help shape it
            </span>
          </div>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">TrackIndia Pro</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Built for people who want the important updates for their watchlist, without scanning the whole tape.
          </p>

          <ul className="mt-5 space-y-3 text-sm text-foreground/80">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-bull" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label="Planned Pro price preference">
            {(["monthly", "yearly"] as PlanId[]).map((id) => {
              const option = PLANS[id];
              const selected = selectedPlan === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedPlan(id)}
                  className={`rounded-2xl border p-3 text-left transition-colors ${selected ? "border-primary bg-primary/10" : "border-border glass-hover"}`}
                >
                  <span className="block text-xs font-semibold text-foreground">{option.label}</span>
                  <span className="mt-1 block font-mono text-lg font-semibold text-foreground">
                    ₹{option.amount}<span className="font-sans text-xs font-normal text-muted-foreground">/{option.per}</span>
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{option.note}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={joinEarlyAccess}
            disabled={busy}
            className="mt-4 w-full rounded-full glass-btn-primary px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {busy
              ? "Saving…"
              : signedIn
                ? `Save ₹${plan.amount}/${plan.per} preference`
                : "Create a free account to register interest"}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Saving interest does not start a subscription, send marketing email or charge you.
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to the tape
        </Link>
      </div>
    </section>
  );
}
