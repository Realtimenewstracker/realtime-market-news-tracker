import { createFileRoute } from "@tanstack/react-router";
import { MarketNewsSection } from "@/components/market-news-section";
export const Route = createFileRoute("/commodities")({ head: () => ({ meta: [
  { title: "Commodities — TrackIndia" }, { name: "description", content: "Oil, gold and commodity activity affecting Indian markets." },
  { property: "og:title", content: "Commodities — TrackIndia" }, { property: "og:description", content: "Latest oil, gold and commodity market headlines." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: () => <MarketNewsSection title="Commodities" category="commodities" /> });