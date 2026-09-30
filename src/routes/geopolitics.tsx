import { createFileRoute } from "@tanstack/react-router";
import { MarketNewsSection } from "@/components/market-news-section";

export const Route = createFileRoute("/geopolitics")({
  head: () => ({ meta: [
    { title: "World events — TrackIndia" },
    { name: "description", content: "Sourced geopolitical and macro headlines with implications for Indian markets." },
    { property: "og:title", content: "World events — TrackIndia" },
    { property: "og:description", content: "Global events relevant to Indian investors." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <MarketNewsSection title="World & geopolitics" keywords={["geopolitic", "conflict", "war", "sanction", "trade war", "tariff", "middle east", "china", "us fed", "oil supply", "global economy", "diplomacy"]} />,
});