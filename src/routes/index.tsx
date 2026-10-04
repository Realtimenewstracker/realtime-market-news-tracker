import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Newspaper, Rocket, Landmark, CalendarDays, Globe2, Bitcoin, Gem } from "lucide-react";
import { TickerBar } from "@/components/ticker-bar";
import { NewsCard, type NewsItem } from "@/components/news-card";
import { NewsDetail } from "@/components/news-detail";
import { MarketNewsSection } from "@/components/market-news-section";
import { LiveIpoTracker } from "@/components/live-ipo-tracker";
import { FilterBar, DEFAULT_FILTERS, isFiltered, type Filters } from "@/components/filter-bar";
import { listNews, listTickers } from "@/lib/data.functions";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrackIndia — Live market news for Indian traders" },
      { name: "description", content: "AI-tagged real-time news feed for NSE, BSE, macro, commodities and crypto — built for Indian traders and investors." },
      { property: "og:title", content: "TrackIndia — Live market news for Indian traders" },
      { property: "og:description", content: "AI-tagged real-time news feed for NSE, BSE, macro, commodities and crypto — built for Indian traders and investors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedPage,
  errorComponent: () => <p role="alert" className="p-8">Market feed unavailable. Please refresh.</p>,
  notFoundComponent: () => <p className="p-8">Market feed not found.</p>,
});

function FeedPage() {
  const listNewsFn = useServerFn(listNews);
  const listTickersFn = useServerFn(listTickers);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [view, setView] = useState<"news" | "ipo" | "policy">("news");

  const { data: tickers } = useQuery({
    queryKey: ["tickers"],
    queryFn: () => listTickersFn(),
    refetchInterval: 300_000,
    refetchIntervalInBackground: false,
  });

  const { data: news, isLoading, isError } = useQuery({
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
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });


  const stats = useMemo(() => {
    const list = news ?? [];
    return {
      total: list.length,
      bull: list.filter((n) => n.sentiment === "bullish").length,
      bear: list.filter((n) => n.sentiment === "bearish").length,
      high: list.filter((n) => (n.impact ?? 0) >= 3).length,
    };
  }, [news]);

  const { topNews, orderedNews } = useMemo(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
    const dayKey = (date: Date) => today.format(date);
    const currentDay = dayKey(new Date());
    const top = (news ?? [])
      .filter((item) => {
        const published = new Date(item.published_at);
        return !Number.isNaN(published.getTime()) && dayKey(published) === currentDay;
      })
      .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0) || Date.parse(b.published_at) - Date.parse(a.published_at))
      .slice(0, 5);
    const topIds = new Set(top.map((item) => item.id));
    return { topNews: top, orderedNews: [...top, ...(news ?? []).filter((item) => !topIds.has(item.id))] };
  }, [news]);

  return (
    <>
      <TickerBar tickers={tickers ?? []} headlines={topNews as NewsItem[]} onHeadlineClick={setSelected} />
      <section className="max-w-7xl mx-auto px-3 md:px-8 pt-6 md:pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground">TrackIndia market news</h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
              AI-tagged headlines from India and the world, ranked by potential impact on NSE, BSE and the rupee.
            </p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto -mx-3 px-3 pb-1 md:mx-0 md:px-0 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Stat label="Stories" value={stats.total} />
            <Stat label="Bull" value={stats.bull} tone="bull" />
            <Stat label="Bear" value={stats.bear} tone="bear" />
            <Stat label="High-impact" value={stats.high} tone="accent" />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-3 md:px-8">
        <div className="mb-3 flex items-center gap-1 border-b border-border max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setView("news")}
            className={`shrink-0 min-h-10 px-3 text-xs font-semibold flex items-center gap-1.5 ${view === "news" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
          >
            <Newspaper size={13} /> News
          </button>
          <Link to="/events" className="shrink-0 min-h-10 px-3 text-xs font-semibold flex items-center gap-1.5 text-muted-foreground"><CalendarDays size={13} /> Events</Link>
          <button onClick={() => setView("ipo")} className={`shrink-0 min-h-10 px-3 text-xs font-semibold flex items-center gap-1.5 ${view === "ipo" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}><Rocket size={13} /> IPO</button>
          <button
            onClick={() => setView("policy")}
            className={`shrink-0 min-h-10 px-3 text-xs font-semibold flex items-center gap-1.5 ${view === "policy" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
          >
            <Landmark size={13} /> Govt Policies
          </button>
          <Link to="/geopolitics" className="shrink-0 min-h-10 px-3 text-xs font-semibold flex items-center gap-1.5 text-muted-foreground"><Globe2 size={13} /> World</Link>
          <Link to="/crypto" className="shrink-0 min-h-10 px-3 text-xs font-semibold flex items-center gap-1.5 text-muted-foreground"><Bitcoin size={13} /> Crypto & FX</Link>
          <Link to="/commodities" className="shrink-0 min-h-10 px-3 text-xs font-semibold flex items-center gap-1.5 text-muted-foreground"><Gem size={13} /> Commodities</Link>
        </div>
        {view === "news" && <FilterBar value={filters} onChange={setFilters} />}
      </section>

      <section className="max-w-7xl mx-auto px-3 md:px-8 pt-5 md:pt-6">
        {view === "ipo" ? (
          <LiveIpoTracker />
        ) : view === "policy" ? (
          <MarketNewsSection title="Policy updates" keywords={["government policy", "cabinet", "rbi", "sebi", "ministry", "budget", "regulation", "scheme"]} />
        ) : isError ? (
          <div role="alert" className="glass rounded-3xl p-8 text-center text-destructive">Market news is temporarily unavailable. Try again shortly.</div>
        ) : isLoading ? (
          <SkeletonGrid />
        ) : (news?.length ?? 0) === 0 ? (
          <EmptyState filtered={isFiltered(filters)} onReset={() => setFilters(DEFAULT_FILTERS)} />
        ) : (
          <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {orderedNews.map((item) => <NewsCard key={item.id} item={item as NewsItem} onClick={() => setSelected(item as NewsItem)} />)}
          </div>
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
    <div className="glass rounded-2xl px-3 py-2 min-w-[68px] shrink-0 text-center">
      <div suppressHydrationWarning className={`font-mono text-lg font-semibold ${color}`}>{value}</div>
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
    <div className="glass rounded-3xl p-8 md:p-12 text-center">
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
          className="mt-4 rounded-full glass-btn-primary px-4 py-2 text-sm font-semibold"
        >
          Reset filters
        </button>
      )}
    </div>
  );

}
