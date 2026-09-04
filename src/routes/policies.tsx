import { createFileRoute } from "@tanstack/react-router";
import { PolicyTracker } from "@/components/policy-tracker";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Govt Policy Tracker — Beneficiary stocks ranked | TrackIndia" },
      {
        name: "description",
        content:
          "Track Indian government policies, budget announcements and regulator decisions, ranked by heat and market impact, with the listed companies likely to benefit.",
      },
      { property: "og:title", content: "Govt Policy Tracker — Beneficiary stocks ranked" },
      {
        property: "og:description",
        content: "Policies, schemes and regulator moves ranked by heat and impact, with possible beneficiary companies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PoliciesPage,
});

function PoliciesPage() {
  return (
    <section className="max-w-7xl mx-auto px-3 md:px-8 pt-6 md:pt-8 pb-6">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
        Govt{" "}
        <span
          className="text-transparent bg-clip-text"
          style={{ backgroundImage: "linear-gradient(120deg,#EA580C,#0EA5E9,#059669)" }}
        >
          Policy Tracker
        </span>
      </h1>
      <p className="mt-2 mb-5 text-sm md:text-base text-muted-foreground max-w-2xl">
        Policies, schemes, budget lines and regulator decisions — ranked by current heat and market impact, with the
        listed companies most likely to benefit.
      </p>
      <PolicyTracker />
    </section>
  );
}
