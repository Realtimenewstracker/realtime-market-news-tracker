import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { X, Plus, Bell } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { listWatchlist, addWatch, removeWatch, listNews } from "@/lib/data.functions";
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
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { user, loading } = useSession();
  const listFn = useServerFn(listWatchlist);
  const addFn = useServerFn(addWatch);
  const removeFn = useServerFn(removeWatch);
  const newsFn = useServerFn(listNews);
  const qc = useQueryClient();
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const { data: items } = useQuery({
    queryKey: ["watchlist"], queryFn: () => listFn(), enabled: !!user,
  });
  const symbols = (items ?? []).filter((i) => i.kind === "symbol").map((i) => i.value);
  const keywords = (items ?? []).filter((i) => i.kind === "keyword").map((i) => i.value);

  const { data: news } = useQuery({
    queryKey: ["watchlist-news", symbols.join(","), keywords.join(",")],
    queryFn: () => newsFn({ data: { tickers: symbols.length ? symbols : null, keywords: keywords.length ? keywords : null, limit: 60 } }),
    enabled: !!user && (symbols.length + keywords.length > 0),
    refetchInterval: 90_000,
  });

  const add = useMutation({
    mutationFn: (v: { kind: "symbol" | "keyword"; value: string }) => addFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["watchlist"] }); toast.success("Added to watchlist"); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const [sym, setSym] = useState("");
  const [kw, setKw] = useState("");

  if (loading) return null;
  if (!user)
    return (
      <section className="max-w-md mx-auto mt-16 px-4 text-center glass-strong rounded-3xl p-8">
        <h1 className="font-display text-2xl">Sign in to build a watchlist</h1>
        <Link to="/auth" className="inline-block mt-4 rounded-full glass-btn-primary px-4 py-2 text-sm font-semibold">Sign in</Link>
      </section>
    );

  return (
    <section className="max-w-6xl mx-auto px-3 md:px-8 pt-6 md:pt-8">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Watchlist</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Filter the tape to the symbols and themes that move your book.
      </p>

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
      <p className="text-[11px] text-muted-foreground mt-3">
        Prices are checked every 2 minutes and the news tape every 5 minutes. Alerts land in the bell
        in the header the moment they fire.
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
