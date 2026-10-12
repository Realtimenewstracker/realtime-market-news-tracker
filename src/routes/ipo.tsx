import { createFileRoute } from "@tanstack/react-router";
import { LiveIpoTracker } from "@/components/live-ipo-tracker";

export const Route = createFileRoute("/ipo")({
  head: () => ({
    meta: [
      { title: "IPO Tracker — Live mainboard & SME IPOs | TrackIndia" },
      { name: "description", content: "Track open, upcoming, closed and listed Indian IPOs with price band, lot size, GMP, subscription and listing gains." },
      { property: "og:title", content: "IPO Tracker — Live mainboard & SME IPOs" },
      { property: "og:description", content: "Open, upcoming and listed Indian IPOs with price band, lot size, GMP and subscription data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IpoPage,
});

function IpoPage() {
  return (
    <section className="max-w-7xl mx-auto px-3 md:px-8 pt-6 md:pt-8 pb-6">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
        IPO{" "}
        <span
          className="text-transparent bg-clip-text"
          style={{ backgroundImage: "linear-gradient(120deg,#EA580C,#0EA5E9,#059669)" }}
        >
          Tracker
        </span>
      </h1>
      <p className="mt-2 mb-5 text-sm md:text-base text-muted-foreground max-w-2xl">
        Mainboard and SME issues — price band, lot size, GMP, subscription and listing performance.
      </p>
       <LiveIpoTracker />
    </section>
  );
}
