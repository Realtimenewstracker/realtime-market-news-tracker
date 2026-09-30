import { createFileRoute } from "@tanstack/react-router";
import { MarketNewsSection } from "@/components/market-news-section";
export const Route = createFileRoute("/crypto")({ head: () => ({ meta: [
  { title: "Crypto & Currency — TrackIndia" }, { name: "description", content: "Crypto and currency news relevant to Indian markets." },
  { property: "og:title", content: "Crypto & Currency — TrackIndia" }, { property: "og:description", content: "Latest crypto and rupee market headlines." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: () => <MarketNewsSection title="Crypto & currency" keywords={["bitcoin", "ethereum", "crypto", "rupee", "currency", "forex", "dollar", "usd/inr"]} /> });