import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { listTickers, listNews } from "@/lib/data.functions";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q.slice(0, 80) : "" }),
  head: () => ({ meta: [{ title: "Search markets — TrackIndia" }, { name: "description", content: "Find Indian stocks, indices and relevant market headlines." }, { property: "og:title", content: "Search markets — TrackIndia" }, { property: "og:description", content: "Search stocks, indices and market news." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: SearchPage,
});
function SearchPage() {
  const { q } = Route.useSearch();
  const [kind, setKind] = useState("all");
  const [move, setMove] = useState("all");
  const navigate = useNavigate();
  const tickersFn = useServerFn(listTickers);
  const newsFn = useServerFn(listNews);
  const { data: tickers } = useQuery({ queryKey: ["tickers"], queryFn: () => tickersFn() });
  const { data: news } = useQuery({ queryKey: ["market-search", q], queryFn: () => newsFn({ data: { q, limit: 18 } }), enabled: q.trim().length > 1 });
  const matches = (tickers ?? []).filter((t) => {
    const textMatch = !q || `${t.alias} ${t.label} ${t.symbol}`.toLowerCase().includes(q.toLowerCase());
    const kindMatch = kind === "all" || t.kind === kind;
    const pct = t.change_pct == null ? null : Number(t.change_pct);
    const moveMatch = move === "all" || (move === "up" && pct != null && pct > 0) || (move === "down" && pct != null && pct < 0);
    return textMatch && kindMatch && moveMatch;
  }).sort((a, b) => (Number(b.change_pct ?? -Infinity) - Number(a.change_pct ?? -Infinity)));
  const kinds = [...new Set((tickers ?? []).map((ticker) => ticker.kind))].sort();
  return <section className="max-w-3xl mx-auto px-3 md:px-8 py-7"><h1 className="font-display text-3xl font-semibold">Search markets</h1>
    <div className="mt-5 flex items-center gap-2 glass-input rounded-full px-4"><SearchIcon size={18} className="text-muted-foreground shrink-0" /><input autoFocus value={q} onChange={(e) => navigate({ to: "/search", search: { q: e.target.value }, replace: true })} placeholder="Stock, index or headline" className="w-full py-3 bg-transparent outline-none text-sm" aria-label="Search markets" /></div>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-xs uppercase font-semibold text-muted-foreground">{q ? "Markets" : "Quick market screener"}</h2>{!q && <p className="mt-1 text-xs text-muted-foreground">Filters the symbols currently carried by TrackIndia. Quote coverage is limited and may be delayed.</p>}</div>
      <div className="flex gap-2">
        <select aria-label="Filter market type" value={kind} onChange={(event) => setKind(event.target.value)} className="min-h-9 rounded-xl border border-border bg-background px-3 text-xs"><option value="all">All types</option>{kinds.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select aria-label="Filter price direction" value={move} onChange={(event) => setMove(event.target.value)} className="min-h-9 rounded-xl border border-border bg-background px-3 text-xs"><option value="all">Any move</option><option value="up">Positive change</option><option value="down">Negative change</option></select>
      </div>
    </div>
    <div className="mt-2 divide-y divide-border">{matches.map((t) => <Link key={t.symbol} to="/market/$symbol" params={{ symbol: t.symbol }} className="py-3 flex justify-between gap-3 text-sm hover:text-accent"><span>{t.label} <span className="font-mono text-xs text-muted-foreground">{t.alias}</span></span><span className="flex shrink-0 items-center gap-3 font-mono"><span>{t.last?.toLocaleString("en-IN") ?? "—"}</span><span className={Number(t.change_pct ?? 0) >= 0 ? "text-bull" : "text-bear"}>{t.change_pct == null ? "—" : `${Number(t.change_pct).toFixed(2)}%`}</span></span></Link>)}{matches.length === 0 && <p className="py-4 text-sm text-muted-foreground">No tracked markets match these filters.</p>}</div>
    {q.trim().length > 1 && !matches.length && <Link to="/market/$symbol" params={{ symbol: q.trim().toUpperCase() }} className="block text-sm text-accent py-3">Look up {q.trim().toUpperCase()} on Yahoo Finance ↗</Link>}
    {q.trim().length > 1 && <><h2 className="mt-8 mb-2 text-xs uppercase font-semibold text-muted-foreground">Relevant headlines</h2><div className="divide-y divide-border">{news?.map((n) => <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" className="block py-3 text-sm hover:text-accent">{n.title} <span className="text-xs text-muted-foreground">· {n.source}</span></a>)}{news?.length === 0 && <p className="text-sm text-muted-foreground py-3">No matching stories.</p>}</div></>}
  </section>;
}
