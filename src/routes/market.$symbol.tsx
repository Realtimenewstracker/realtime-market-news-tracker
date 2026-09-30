import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { getMarketQuote, getUpcomingEvents } from "@/lib/market.functions";
import { listNews } from "@/lib/data.functions";

export const Route = createFileRoute("/market/$symbol")({ head: ({ params }) => ({ meta: [
  { title: `${params.symbol} market data — TrackIndia` }, { name: "description", content: `Latest quote, chart, news and events for ${params.symbol}.` },
  { property: "og:title", content: `${params.symbol} market data — TrackIndia` }, { property: "og:description", content: `Quote, chart, news and events for ${params.symbol}.` }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: MarketPage });
function MarketPage() {
  const { symbol } = Route.useParams();
  const quoteFn = useServerFn(getMarketQuote);
  const newsFn = useServerFn(listNews);
  const eventsFn = useServerFn(getUpcomingEvents);
  const { data: quote, isPending, isError } = useQuery({ queryKey: ["quote", symbol], queryFn: () => quoteFn({ data: { symbol: symbol.toUpperCase() } }), retry: 1, refetchInterval: 120_000 });
  const alias = symbol.replace(/\.NS$/, "").toUpperCase();
  const { data: news } = useQuery({ queryKey: ["symbol-news", alias], queryFn: () => newsFn({ data: { q: alias, limit: 12 } }) });
  const { data: events } = useQuery({ queryKey: ["nse-events"], queryFn: () => eventsFn(), retry: 1 });
  const filteredEvents = events?.filter((e) => e.symbol === alias) ?? [];
  return <section className="max-w-5xl mx-auto px-3 md:px-8 py-7"><Link to="/search" className="text-sm text-accent">← Search</Link>
    {isPending ? <p className="mt-6">Loading quote…</p> : isError || !quote ? <p role="alert" className="mt-6 text-destructive">This symbol has no available market quote.</p> : <>
      <h1 className="font-display text-3xl font-semibold mt-5">{quote.name}</h1><p className="font-mono text-xs text-muted-foreground">{alias} · {quote.source} · quotes may be delayed</p>
      <div className="mt-6 flex items-baseline gap-3"><strong className="font-mono text-3xl">{quote.last?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"} {quote.currency}</strong>{quote.last != null && quote.previous != null && <span className={`font-mono text-sm ${quote.last >= quote.previous ? "text-bull" : "text-bear"}`}>{((quote.last - quote.previous) / quote.previous * 100).toFixed(2)}%</span>}</div>
      {quote.points.length > 1 && <div className="mt-6 h-56 w-full" aria-label="One month price chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={quote.points}><XAxis dataKey="at" hide /><Tooltip labelFormatter={(value) => new Date(Number(value) * 1000).toLocaleDateString("en-IN")} /><Area type="monotone" dataKey="close" stroke="var(--accent)" fill="var(--muted)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">{[["Previous close", quote.previous], ["52-week high", quote.high52], ["52-week low", quote.low52], ["Volume", quote.volume]].map(([label, value]) => <div key={String(label)}><p className="text-xs text-muted-foreground">{label}</p><strong className="font-mono">{value?.toLocaleString("en-IN") ?? "—"}</strong></div>)}</div>
      <p className="mt-5 text-xs text-muted-foreground">Company financial statements are not available from this quote source; no financial figures are estimated.</p>
    </>}
    <h2 className="font-display text-xl font-semibold mt-10">Upcoming events</h2>{filteredEvents.length ? filteredEvents.map((e, i) => <a key={i} href={e.url} target="_blank" rel="noopener noreferrer" className="block border-b border-border py-3 text-sm">{e.date} · {e.kind} · {e.detail}</a>) : <p className="text-sm text-muted-foreground mt-2">No upcoming exchange events reported.</p>}
    <h2 className="font-display text-xl font-semibold mt-10">Latest news</h2>{news?.length ? news.map((n) => <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" className="block border-b border-border py-3 text-sm hover:text-accent">{n.title} <span className="text-muted-foreground text-xs">· {n.source}</span></a>) : <p className="text-sm text-muted-foreground mt-2">No matching headlines.</p>}
  </section>;
}