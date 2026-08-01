import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TickerBar } from "@/components/ticker-bar";
import { NewsCard, type NewsItem } from "@/components/news-card";
import { NewsDetail } from "@/components/news-detail";
import { FilterBar, DEFAULT_FILTERS, type Filters } from "@/components/filter-bar";
import { listNews, listTickers } from "@/lib/data.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrackIndia — Live market news for Indian traders" },
      { name: "description", content: "AI-tagged real-time news feed for NSE, BSE, macro, commodities and crypto — built for Indian traders and investors." },
      { property: "og:title", content: "TrackIndia — Live market news for Indian traders" },
      { property: "og:description", content: "AI-tagged real-time news feed for NSE, BSE, macro, commodities and crypto — built for Indian traders and investors." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery({ queryKey: ["tickers"], queryFn: () => listTickers() }),
      context.queryClient.prefetchQuery({
        queryKey: ["news", "all", "all", 0, "", "all"],
        queryFn: () => listNews({ data: { limit: 60 } }),
      }),
    ]);
    return null;
  },
  component: FeedPage,
});

function FeedPage() {
  const router = useRouter();
  const listNewsFn = useServerFn(listNews);
  const listTickersFn = useServerFn(listTickers);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const { data: tickers } = useQuery({
    queryKey: ["tickers"],
    queryFn: () => listTickersFn(),
    refetchInterval: 120_000,
  });

  const { data: news, isLoading } = useQuery({
    queryKey: ["news", filters.category, filters.sentiment, filters.impact, filters.q, filters.region],
    queryFn: () =>
      listNewsFn({
        data: {
          category: filters.category === "all" ? null : filters.category,
          sentiment: filters.sentiment === "all" ? null : filters.sentiment,
          region: filters.region === "all" ? null : filters.region,
          impact: filters.impact || null,
          q: filters.q || null,
          limit: 60,
        },
      }),
    refetchInterval: 90_000,
  });


  // Auto-ingest if empty on first load
  useEffect(() => {
    if (!isLoading && (news?.length ?? 0) === 0) {
      fetch("/api/public/ingest-rss", { method: "POST" })
        .then(() => router.invalidate())
        .catch(() => {});
      fetch("/api/public/refresh-tickers", { method: "POST" }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const stats = useMemo(() => {
    const list = news ?? [];
    return {
      total: list.length,
      bull: list.filter((n) => n.sentiment === "bullish").length,
      bear: list.filter((n) => n.sentiment === "bearish").length,
      high: list.filter((n) => (n.impact ?? 0) >= 3).length,
    };
  }, [news]);

  return (
    <>
      <TickerBar tickers={tickers ?? []} />
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
              The live tape,{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(120deg,#EA580C,#0EA5E9,#059669)" }}
              >
                for Indian markets
              </span>
            </h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
              AI-tagged headlines from India and the world, ranked by potential impact on NSE, BSE and the rupee.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Stat label="Stories" value={stats.total} />
            <Stat label="Bull" value={stats.bull} tone="bull" />
            <Stat label="Bear" value={stats.bear} tone="bear" />
            <Stat label="High-impact" value={stats.high} tone="accent" />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <FilterBar value={filters} onChange={setFilters} />
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        {isLoading ? (
          <SkeletonGrid />
        ) : (news?.length ?? 0) === 0 ? (
          <EmptyState filtered={filters !== DEFAULT_FILTERS} onReset={() => setFilters(DEFAULT_FILTERS)} />

        ) : (
          <motion.div layout className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {news!.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  <NewsCard item={item as NewsItem} onClick={() => setSelected(item as NewsItem)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <NewsDetail item={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "bull" | "bear" | "accent" }) {
  const color =
    tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : tone === "accent" ? "text-accent" : "text-foreground";
  return (
    <div className="glass rounded-2xl px-3 py-2 min-w-[70px] text-center">
      <div className={`font-mono text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="glass rounded-3xl p-6 h-56 animate-pulse" />
      ))}
    </div>
  );
}
function EmptyState({ filtered, onReset }: { filtered?: boolean; onReset?: () => void }) {
  return (
    <div className="glass rounded-3xl p-12 text-center">
      <p className="font-display text-xl text-foreground">
        {filtered ? "No stories match these filters" : "Loading the tape…"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {filtered
          ? "Try a broader geography or a lower impact threshold."
          : "Pulling the first batch of stories. Refresh in a few seconds."}
      </p>
      {filtered && onReset && (
        <button
          onClick={onReset}
          className="mt-4 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
        >
          Reset filters
        </button>
      )}
    </div>
  );

}
