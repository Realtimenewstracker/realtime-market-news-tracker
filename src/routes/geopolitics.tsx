import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listHotspots, listNews } from "@/lib/data.functions";
import { useState } from "react";
import { NewsCard, type NewsItem } from "@/components/news-card";
import { NewsDetail } from "@/components/news-detail";

export const Route = createFileRoute("/geopolitics")({
  head: () => ({
    meta: [
      { title: "Geopolitics — TrackIndia" },
      { name: "description", content: "Global flashpoints and macro events that move Indian markets." },
      { property: "og:title", content: "Geopolitics — TrackIndia" },
      { property: "og:description", content: "Global developments and macro events affecting Indian markets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GeoPage,
});

function GeoPage() {
  const hotspotsFn = useServerFn(listHotspots);
  const newsFn = useServerFn(listNews);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const { data: hotspots } = useQuery({ queryKey: ["hotspots"], queryFn: () => hotspotsFn() });
  const { data: news } = useQuery({
    queryKey: ["geo-news"],
    queryFn: () => newsFn({ data: { category: "macro", limit: 24 } }),
    refetchInterval: 120_000,
  });

  return (
    <section className="max-w-6xl mx-auto px-3 md:px-8 pt-6 md:pt-8">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Geopolitics</h1>
      <p className="text-sm text-muted-foreground mt-1">Flashpoints and macro events. Ranked by severity.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(hotspots ?? []).map((h) => (
          <div key={h.id} className="glass rounded-3xl p-4 md:p-5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display text-lg font-semibold truncate">{h.name}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">{h.region}</div>
              </div>
              <div className="shrink-0"><SeverityBadge sev={h.severity ?? 1} /></div>
            </div>
            {h.summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-4">{h.summary}</p>}
            {h.market_impact && (
              <div className="mt-3 text-xs">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Market impact · </span>
                <span className="text-foreground">{h.market_impact}</span>
              </div>
            )}
          </div>
        ))}
        {(hotspots?.length ?? 0) === 0 && (
          <div className="md:col-span-2 lg:col-span-3 glass rounded-3xl p-8 text-center text-muted-foreground text-sm">
            No hotspots configured yet.
          </div>
        )}
      </div>

      <h2 className="font-display text-xl font-semibold mt-10 mb-3">Macro headlines</h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {(news ?? []).map((n) => (
          <NewsCard key={n.id} item={n as NewsItem} onClick={() => setSelected(n as NewsItem)} />
        ))}
      </div>
      <NewsDetail item={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </section>
  );
}

function SeverityBadge({ sev }: { sev: number }) {
  const tone = sev >= 3 ? "bg-bear-tint" : sev === 2 ? "bg-accent-tint" : "bg-neu-tint";
  const label = sev >= 3 ? "HIGH" : sev === 2 ? "MED" : "LOW";
  return <span className={`${tone} rounded-full px-2.5 py-0.5 text-[10px] font-semibold font-mono`}>{label}</span>;
}
