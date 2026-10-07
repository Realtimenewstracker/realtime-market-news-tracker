import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveIpos, getIpoSummary } from "@/lib/market.functions";
import { addWatch, listWatchlist, removeWatch } from "@/lib/data.functions";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Ipo = Awaited<ReturnType<typeof getLiveIpos>>["issues"][number];
export function LiveIpoTracker() {
  const fn = useServerFn(getLiveIpos), watchFn = useServerFn(listWatchlist);
  const addFn = useServerFn(addWatch), removeFn = useServerFn(removeWatch);
  const qc = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [view, setView] = useState("All");
  const [selected, setSelected] = useState<Ipo | null>(null);
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["nse-live-ipos"], queryFn: () => fn(), refetchInterval: 300_000, refetchIntervalInBackground: false, staleTime: 120_000 });
  const { data: watched, refetch: refetchWatched } = useQuery({ queryKey: ["watchlist"], queryFn: () => watchFn(), retry: false });
  const toggle = async (symbol: string) => {
    setSaving(symbol);
    try {
      const item = watched?.find((w) => w.kind === "symbol" && w.value === symbol);
      if (item) await removeFn({ data: { id: item.id } }); else await addFn({ data: { kind: "symbol", value: symbol } });
      await refetchWatched();
      qc.invalidateQueries({ queryKey: ["alerts"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Watchlist unavailable"); } finally { setSaving(null); }
  };
  const issues = (data?.issues ?? []).filter((i) => view === "All" || i.status === view);
  return <div>
    <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="IPO status">
      {["All", "Open", "Upcoming", "Closed"].map((label) => <Button key={label} variant={view === label ? "default" : "outline"} size="sm" aria-pressed={view === label} onClick={() => setView(label)}>{label}</Button>)}
    </div>
    <p className="text-xs text-muted-foreground mb-4">NSE · {data ? `Checked ${new Date(data.checkedAt).toLocaleString("en-IN")}` : "Current and upcoming equity issues"}</p>
    {data && !data.upcomingAvailable && <p role="alert" className="text-sm text-destructive mb-4">Upcoming issue feed is unavailable. Current issues remain shown.</p>}
    {isPending ? <p className="text-muted-foreground">Loading issues…</p> : isError ? <div role="alert"><p className="text-destructive">IPO data is unavailable from NSE.</p><Button variant="outline" onClick={() => refetch()}>Retry</Button></div> :
    issues.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{issues.map((ipo) => <article key={ipo.symbol ?? ipo.name} className="glass-card p-5 flex flex-col gap-3">
      <div className="flex justify-between gap-2"><div className="min-w-0"><h2 className="font-display text-lg font-semibold text-foreground">{ipo.name}</h2><p className="text-xs font-mono text-muted-foreground">{ipo.symbol ?? "Symbol pending"} · {ipo.board}</p></div><span className="text-xs font-semibold text-bull shrink-0">{ipo.status}</span></div>
      <div className="grid grid-cols-2 gap-3 text-xs"><div><span className="text-muted-foreground">Price band</span><p className="font-semibold">{ipo.priceBand}</p></div><div><span className="text-muted-foreground">Subscription</span><p className="font-semibold">{ipo.subscription == null ? "Not available" : `${ipo.subscription.toFixed(2)}×`}</p></div><div><span className="text-muted-foreground">Opens</span><p>{ipo.openDate ?? "Not announced"}</p></div><div><span className="text-muted-foreground">Closes</span><p>{ipo.closeDate ?? "Not announced"}</p></div></div>
      <div className="mt-auto flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" onClick={() => setSelected(ipo)}><Sparkles size={14}/> Details & AI summary</Button>{ipo.symbol && <Button variant="ghost" size="sm" disabled={saving === ipo.symbol} onClick={() => { if (ipo.symbol) toggle(ipo.symbol); }} aria-label={`Watch ${ipo.name}`}><Star size={14}/>{watched?.some((w) => w.kind === "symbol" && w.value === ipo.symbol) ? "Watching" : "Watch"}</Button>}</div>
    </article>)}</div> : <p className="text-muted-foreground">{view === "Upcoming" ? "No upcoming equity IPOs announced in the exchange feed." : "No equity IPOs reported by NSE for this view."}</p>}
    <a href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-sm text-accent">Exchange announcements <ExternalLink size={13}/></a>
    <Dialog open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }}><DialogContent className="glass-strong">{selected && <IpoDetails key={selected.symbol ?? selected.name} ipo={selected}/>}</DialogContent></Dialog>
  </div>;
}
function IpoDetails({ ipo }: { ipo: Ipo }) {
  const summarize = useServerFn(getIpoSummary);
  const [summary, setSummary] = useState<string | null>(null), [error, setError] = useState<string | null>(null), [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true); setError(null);
    try { const result = await summarize({ data: { symbol: ipo.symbol ?? ipo.name } }); setSummary(result.summary); }
    catch (e) { setError(e instanceof Error ? e.message : "AI summary unavailable."); }
    finally { setLoading(false); }
  };
  return <><DialogTitle className="pr-8">{ipo.name}</DialogTitle><DialogDescription>{ipo.symbol ?? "Symbol pending"} · {ipo.board} · {ipo.status} · Source: {ipo.source}</DialogDescription>
    <dl className="grid grid-cols-2 gap-3 text-sm">{[["Price band",ipo.priceBand],["Opening",ipo.openDate],["Closing",ipo.closeDate],["Offered shares",ipo.offeredShares],["Subscription",ipo.subscription == null ? null : `${ipo.subscription}×`]].map(([label,value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value ?? "Not announced"}</dd></div>)}</dl>
    <p className="text-xs text-muted-foreground">Business description, financials, lot size, allotment, listing date, valuation, use of proceeds and GMP are not supplied by this exchange feed.</p>
    <h3 className="font-semibold">AI summary</h3>
    {summary ? <p className="text-sm whitespace-pre-line">{summary}</p> : <Button disabled={loading || !!error} onClick={generate}><Sparkles size={14}/>{loading ? "Summarizing…" : "Generate AI summary"}</Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p className="text-xs text-muted-foreground">AI-generated from exchange data; not investment advice.</p>
    <Button variant="outline" asChild><a href={ipo.url} target="_blank" rel="noopener noreferrer">View official disclosure <ExternalLink size={14}/></a></Button>
  </>;
}
