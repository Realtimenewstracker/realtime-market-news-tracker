import { createFileRoute } from "@tanstack/react-router";
import { LiveIpoTracker } from "@/components/live-ipo-tracker";

export const Route = createFileRoute("/ipo")({
  head: () => ({
    meta: [
      { title: "IPO Tracker — Live mainboard & SME IPOs | TrackIndia" },
      { name: "description", content: "See current and upcoming Indian IPOs reported by NSE, with issue dates, price band and subscription when available." },
      { property: "og:title", content: "IPO Tracker — Live mainboard & SME IPOs" },
      { property: "og:description", content: "Current and upcoming Indian IPOs reported by NSE, with issue dates, price band and subscription when available." },
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
        Current and upcoming mainboard and SME issues from NSE, with dates, price band and subscription when available. Open the exchange disclosure for official details.
      </p>
       <LiveIpoTracker />
    </section>
  );
}
