import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Plus, Bell, FolderPlus } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { listWatchlists, createWatchlist, listWatchlist, addWatch, removeWatch, listNews } from "@/lib/data.functions";
import { getAlertSettings, saveAlertSettings, type AlertSettings } from "@/lib/alerts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { NewsCard, type NewsItem } from "@/components/news-card";
import { NewsDetail } from "@/components/news-detail";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — TrackIndia" },
      { name: "description", content: "Follow the symbols and themes that matter to you across the live news tape." },
      { property: "og:title", content: "Watchlist — TrackIndia" },
      { property: "og:description", content: "Follow symbols and themes on your market watchlist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { user, loading } = useSession();
  const listsFn = useServerFn(listWatchlists);
  const createListFn = useServerFn(createWatchlist);
  const listFn = useServerFn(listWatchlist);
  const addFn = useServerFn(addWatch);
  const removeFn = useServerFn(removeWatch);
  const newsFn = useServerFn(listNews);
  const qc = useQueryClient();
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [activeWatchlistId, setActiveWatchlistId] = useState("");
  const [newListName, setNewListName] = useState("");

  const { data: watchlists } = useQuery({ queryKey: ["watchlists", user?.id], queryFn: () => listsFn(), enabled: !!user });
  useEffect(() => {
    if (!watchlists?.length) return;
    if (!watchlists.some((list) => list.id === activeWatchlistId)) setActiveWatchlistId(watchlists[0].id);
  }, [watchlists, activeWatchlistId]);

  const { data: items } = useQuery({
    queryKey: ["watchlist", activeWatchlistId],
    queryFn: () => listFn({ data: { watchlistId: activeWatchlistId } }),
    enabled: !!user && !!activeWatchlistId,
  });
  const symbols = (items ?? []).filter((i) => i.kind === "symbol").map((i) => i.value);
  const keywords = (items ?? []).filter((i) => i.kind === "keyword").map((i) => i.value);

  const { data: news } = useQuery({
    queryKey: ["watchlist-news", symbols.join(","), keywords.join(",")],
    queryFn: async () => {
      const [symbolMatches, keywordMatches] = await Promise.all([
        symbols.length ? newsFn({ data: { tickers: symbols, limit: 60 } }) : Promise.resolve([]),
        keywords.length ? newsFn({ data: { keywords, limit: 60 } }) : Promise.resolve([]),
      ]);
      return [...new Map([...symbolMatches, ...keywordMatches].map((story) => [story.id, story] as const)).values()]
        .sort((a, b) => b.published_at.localeCompare(a.published_at));
    },
    enabled: !!user && (symbols.length + keywords.length > 0),
    refetchInterval: 90_000,
  });

  const add = useMutation({
    mutationFn: (v: { kind: "symbol" | "keyword"; value: string }) => addFn({ data: { ...v, watchlist_id: activeWatchlistId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["watchlist", activeWatchlistId] }); toast.success("Added to watchlist"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add that item"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist", activeWatchlistId] }),
  });
  const createList = useMutation({
    mutationFn: (name: string) => createListFn({ data: { name } }),
    onSuccess: (list) => {
      qc.invalidateQueries({ queryKey: ["watchlists"] });
      setActiveWatchlistId(list.id);
      setNewListName("");
      toast.success(`${list.name} created`);
    },
    onError: () => toast.error("Could not create that list. Check its name or try a different one."),
  });

  const [sym, setSym] = useState("");
  const [kw, setKw] = useState("");

  if (loading) return null;
  if (!user)
    return (
      <section className="max-w-md mx-auto mt-16 px-4 text-center glass-strong rounded-3xl p-8">
        <h1 className="font-display text-2xl">Sign in to build a watchlist</h1>
        <Link to="/auth" search={{}} className="inline-block mt-4 rounded-full glass-btn-primary px-4 py-2 text-sm font-semibold">Sign in</Link>
      </section>
    );

  return (
    <section className="max-w-6xl mx-auto px-3 md:px-8 pt-6 md:pt-8">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Watchlist</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Filter the tape to the symbols and themes that move your book.
      </p>

      <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:items-center">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="watchlist-picker">Current list</label>
        <select id="watchlist-picker" value={activeWatchlistId} onChange={(e) => setActiveWatchlistId(e.target.value)} className="min-h-10 rounded-xl border border-border bg-background px-3 text-sm sm:min-w-48">
          {(watchlists ?? []).map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
        </select>
        <form onSubmit={(e) => { e.preventDefault(); const name = newListName.trim(); if (name) createList.mutate(name); }} className="flex gap-2 sm:ml-auto">
          <Input value={newListName} onChange={(e) => setNewListName(e.target.value)} maxLength={40} placeholder="Name another list" aria-label="New watchlist name" className="min-w-0 sm:w-48" />
          <Button type="submit" variant="outline" className="shrink-0 rounded-full" disabled={!newListName.trim() || createList.isPending}><FolderPlus size={14} /><span className="hidden sm:inline">Create list</span></Button>
        </form>
      </div>

      <div className="mt-6 grid gap-3 md:gap-4 md:grid-cols-2">
        <Card title="Symbols">
          <ChipList items={items?.filter((i) => i.kind === "symbol") ?? []} onRemove={(id) => remove.mutate(id)} />
          <form onSubmit={(e) => { e.preventDefault(); if (sym) { add.mutate({ kind: "symbol", value: sym }); setSym(""); } }} className="mt-3 flex gap-2 min-w-0">
            <Input value={sym} onChange={(e) => setSym(e.target.value)} placeholder="e.g. RELIANCE" className="min-w-0" />
            <Button type="submit" className="rounded-full shrink-0"><Plus size={14} /></Button>
          </form>
        </Card>
        <Card title="Keywords">
          <ChipList items={items?.filter((i) => i.kind === "keyword") ?? []} onRemove={(id) => remove.mutate(id)} />
          <form onSubmit={(e) => { e.preventDefault(); if (kw) { add.mutate({ kind: "keyword", value: kw }); setKw(""); } }} className="mt-3 flex gap-2 min-w-0">
            <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="e.g. RBI, crude oil" className="min-w-0" />
            <Button type="submit" className="rounded-full shrink-0"><Plus size={14} /></Button>
          </form>
        </Card>
      </div>

      <AlertSettingsCard />


      <div className="mt-8">
        <h2 className="font-display text-xl font-semibold mb-3">Matching stories</h2>
        {symbols.length + keywords.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-muted-foreground text-sm">Add a symbol or keyword to start filtering the tape.</div>
        ) : (news?.length ?? 0) === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-muted-foreground text-sm">No matches in the last batch. Try broader keywords.</div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {news!.map((n) => (
              <NewsCard key={n.id} item={n as NewsItem} onClick={() => setSelected(n as NewsItem)} />
            ))}
          </div>
        )}
      </div>

      <NewsDetail item={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </section>
  );
}

function AlertSettingsCard() {
  const getFn = useServerFn(getAlertSettings);
  const saveFn = useServerFn(saveAlertSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["alert-settings"], queryFn: () => getFn() });

  const save = useMutation({
    mutationFn: (s: AlertSettings) => saveFn({ data: s }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-settings"] });
      toast.success("Alert preferences saved");
    },
  });

  if (!data) return null;
  const patch = (p: Partial<AlertSettings>) => save.mutate({ ...data, ...p });

  return (
    <div className="mt-6 glass rounded-3xl p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={14} className="text-primary" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Real-time alerts
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Price move alerts</span>
            <Switch checked={data.price_enabled} onCheckedChange={(v) => patch({ price_enabled: v })} />
          </label>
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Notify on moves over</span>
              <span className="font-mono text-foreground">{data.price_threshold_pct.toFixed(1)}%</span>
            </div>
            <Slider
              value={[data.price_threshold_pct]}
              min={0.5}
              max={10}
              step={0.5}
              onValueChange={(v) => patch({ price_threshold_pct: v[0] })}
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>News alerts</span>
            <Switch checked={data.news_enabled} onCheckedChange={(v) => patch({ news_enabled: v })} />
          </label>
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Minimum story impact</span>
              <span className="font-mono text-foreground">{data.min_impact}/3</span>
            </div>
            <Slider
              value={[data.min_impact]}
              min={0}
              max={3}
              step={1}
              onValueChange={(v) => patch({ min_impact: v[0] })}
            />
          </div>
        </div>
      </div>
      <label className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0">
          New IPO announcements
          <span className="block text-[11px] text-muted-foreground">
            Alert me when NSE lists a new upcoming IPO. Off by default.
          </span>
        </span>
        <Switch
          checked={data.ipo_announce_enabled}
          onCheckedChange={(v) => patch({ ipo_announce_enabled: v })}
        />
      </label>
      <p className="text-[11px] text-muted-foreground mt-3">
        Prices are checked every 2 minutes and the news tape every 5 minutes. IPO alerts are checked
        every 15 minutes. Alerts land in the bell in the header the moment they fire.
      </p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-4 md:p-5 min-w-0">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

function ChipList({ items, onRemove }: { items: { id: string; value: string }[]; onRemove: (id: string) => void }) {
  if (items.length === 0) return <div className="text-xs text-muted-foreground">None yet.</div>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i.id} className="glass rounded-full pl-3 pr-1.5 py-1 flex max-w-full items-center gap-1 text-xs font-medium">
          <span className="truncate">{i.value}</span>
          <button onClick={() => onRemove(i.id)} className="shrink-0 text-muted-foreground hover:text-bear"><X size={12} /></button>
        </span>
      ))}
    </div>
  );
}
