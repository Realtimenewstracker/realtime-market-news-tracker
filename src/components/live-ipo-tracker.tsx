import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveIpos } from "@/lib/market.functions";

export function LiveIpoTracker() {
  const fn = useServerFn(getLiveIpos);
  const { data, isPending, isError } = useQuery({ queryKey: ["nse-live-ipos"], queryFn: () => fn(), refetchInterval: 300_000, staleTime: 120_000 });
  return <div>
    <p className="text-xs text-muted-foreground mb-4">Current issues directly from NSE · refreshes every 5 minutes. Unpublished prices and dates are not estimated.</p>
    {isPending ? <p className="text-muted-foreground">Loading current issues…</p> : isError ? <p role="alert" className="text-destructive">Current IPO data is unavailable from NSE. Try again later.</p> :
    data?.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((ipo) => <article key={ipo.symbol ?? ipo.name} className="glass-card p-5 flex flex-col gap-3">
      <div className="flex justify-between gap-2"><div className="min-w-0"><h2 className="font-display text-lg font-semibold text-foreground">{ipo.name}</h2><p className="text-xs font-mono text-muted-foreground">{ipo.symbol ?? "Symbol pending"} · {ipo.board}</p></div><span className="text-xs font-semibold text-bull shrink-0">{ipo.status}</span></div>
      <div className="grid grid-cols-2 gap-3 text-xs"><div><span className="text-muted-foreground">Price band</span><p className="font-semibold">{ipo.priceBand}</p></div><div><span className="text-muted-foreground">Subscription</span><p className="font-semibold">{ipo.subscription == null ? "Not available" : `${ipo.subscription.toFixed(2)}×`}</p></div><div><span className="text-muted-foreground">Opens</span><p>{ipo.openDate ?? "Not announced"}</p></div><div><span className="text-muted-foreground">Closes</span><p>{ipo.closeDate ?? "Not announced"}</p></div></div>
      <a href={ipo.url} target="_blank" rel="noopener noreferrer" className="mt-auto text-xs text-accent">View on NSE ↗</a>
    </article>)}</div> : <p className="text-muted-foreground">No current issues reported by NSE.</p>}
  </div>;
}