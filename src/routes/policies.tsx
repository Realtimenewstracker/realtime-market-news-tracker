import { createFileRoute } from "@tanstack/react-router";
import { MarketNewsSection } from "@/components/market-news-section";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
       { title: "Government policy news — TrackIndia" },
      {
        name: "description",
        content:
           "Track sourced government policy news, budget announcements and regulator decisions relevant to Indian markets.",
      },
       { property: "og:title", content: "Government policy news — TrackIndia" },
      {
        property: "og:description",
         content: "Recent sourced policy and regulator headlines for Indian markets.",
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
          Policy News
        </span>
      </h1>
      <p className="mt-2 mb-5 text-sm md:text-base text-muted-foreground max-w-2xl">
        Recent headlines about government policy, budgets and regulators. This is a keyword-filtered news feed, not a structured tracker of policy status or company impact.
      </p>
        <p className="text-xs text-muted-foreground mb-3">Each story links to its source. Headline relevance and possible market effects need independent verification.</p>
       <MarketNewsSection title="Policy updates" keywords={["government policy", "cabinet", "rbi", "sebi", "ministry", "budget", "regulation", "scheme", "repo rate"]} />
    </section>
  );
}
