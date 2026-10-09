import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { listAllWatchlistItems, listNews } from "@/lib/data.functions";

export function WatchlistBriefing() {
  const { user } = useSession();
  const itemsFn = useServerFn(listAllWatchlistItems);
  const newsFn = useServerFn(listNews);
  const { data: items, isPending } = useQuery({
    queryKey: ["all-watchlist-items", user?.id],
    queryFn: () => itemsFn(),
    enabled: !!user,
    staleTime: 60_000,
  });
  const symbols = [...new Set((items ?? []).filter((item) => item.kind === "symbol").map((item) => item.value))];
  const keywords = [...new Set((items ?? []).filter((item) => item.kind === "keyword").map((item) => item.value))];
  const { data: stories, isFetching } = useQuery({
    queryKey: ["personal-briefing", user?.id, symbols.join(","), keywords.join(",")],
    queryFn: async () => {
      const [symbolMatches, keywordMatches] = await Promise.all([
        symbols.length ? newsFn({ data: { tickers: symbols, limit: 60 } }) : Promise.resolve([]),
        keywords.length ? newsFn({ data: { keywords, limit: 60 } }) : Promise.resolve([]),
      ]);
      return [...new Map([...symbolMatches, ...keywordMatches].map((story) => [story.id, story] as const)).values()]
        .sort((a, b) => b.published_at.localeCompare(a.published_at))
        .slice(0, 3);
    },
    enabled: !!user && (symbols.length + keywords.length > 0),
    staleTime: 60_000,
    refetchInterval: 180_000,
  });

  if (!user) return null;

  return (
    <section aria-labelledby="watchlist-briefing-title" className="max-w-7xl mx-auto px-3 md:px-8 mt-2">
      <div className="glass rounded-3xl p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-primary">Personalized from your watchlists</p>
            <h2 id="watchlist-briefing-title" className="mt-1 font-display text-lg font-semibold">Your watchlist brief</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Recent stories matched to the symbols and topics you follow.</p>
          </div>
          <Link to="/watchlist" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Edit lists <ArrowUpRight size={13} /></Link>
        </div>
        {isPending ? <p className="mt-4 text-sm text-muted-foreground">Loading your watchlists…</p> : !items?.length ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Newspaper size={15} /><span>Add symbols or topics to get a personal brief.</span></div>
        ) : isFetching && !stories ? <p className="mt-4 text-sm text-muted-foreground">Finding matching stories…</p> : stories?.length ? (
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {stories.map((story) => (
              <a key={story.id} href={story.url} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-border/70 bg-background/50 p-3 hover:border-primary/40">
                <span className="text-[10px] text-muted-foreground">{story.source} · {new Date(story.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                <span className="mt-1 block text-sm font-medium leading-snug line-clamp-2">{story.title}</span>
                <span className="mt-2 block text-[10px] text-muted-foreground">Impact estimate: {story.impact ?? "—"}/3 · {story.sentiment ?? "tone unavailable"}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No matching stories in the recent feed. Your watchlists are saved and we’ll show matches when available.</p>
        )}
      </div>
    </section>
  );
}
