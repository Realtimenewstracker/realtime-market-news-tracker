import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NewsItem } from "@/components/news-card";

type Ticker = {
  symbol: string;
  alias: string;
  label: string;
  kind: string;
  last: number | null;
  change: number | null;
  change_pct: number | null;
};

const byOrder = (a: Ticker, b: Ticker) =>
  a.kind === b.kind ? (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0) : a.kind < b.kind ? -1 : 1;

export function TickerBar({ tickers, headlines = [], onHeadlineClick }: { tickers: Ticker[]; headlines?: NewsItem[]; onHeadlineClick?: (item: NewsItem) => void }) {
  // The live tape can change between the server render and hydration, so the
  // pills are only mounted on the client to avoid a hydration mismatch.
  const [hydrated, setHydrated] = useState(false);
  const items = useMemo(
    () => [...tickers].sort(byOrder),
    [tickers],
  );
  useEffect(() => {
    setHydrated(true);
  }, []);

  const sequence = [
    ...headlines.slice(0, 5).map((item) => ({ type: "news" as const, item })),
    ...items.map((item) => ({ type: "ticker" as const, item })),
  ];
  const doubled = [...sequence, ...sequence];

  return (
    <div className="glass-strong border-b border-white/70 py-2.5 marquee-mask overflow-hidden sticky top-0 z-40">
      <div className="marquee-track min-h-8" suppressHydrationWarning>
        {hydrated &&
          doubled.map((entry, i) => entry.type === "news"
            ? <Button key={`headline-${entry.item.id}-${i}`} variant="outline" onClick={() => onHeadlineClick?.(entry.item)} className="mx-1.5 md:mx-3 shrink-0 max-w-[320px] h-8 px-3 flex items-center gap-2 text-xs"><Newspaper size={13} className="text-accent" /><span className="truncate">{entry.item.title}</span></Button>
            : <TickerPill key={`${entry.item.symbol}-${i}`} t={entry.item} />)}
      </div>

    </div>
  );
}

function TickerPill({ t }: { t: Ticker }) {
  const pct = t.change_pct ?? 0;
  const up = pct >= 0;
  return (
    <Link to="/market/$symbol" params={{ symbol: t.symbol }} className="mx-1.5 md:mx-3 flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-1.5 rounded-full glass shrink-0 whitespace-nowrap">
      <span className="font-display font-semibold tracking-tight text-foreground text-sm">
        {t.label || t.alias}
      </span>
      <span className="font-mono text-foreground text-sm">{fmt(t.last, t.kind)}</span>
      <span className={`font-mono text-xs flex items-center gap-1 ${up ? "text-bull" : "text-bear"}`}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {up ? "+" : ""}
        {pct.toFixed(2)}%
      </span>
    </Link>
  );
}

function fmt(p: number | null, kind: string) {
  if (p == null || Number.isNaN(p)) return "—";
  if (kind === "crypto" && p < 5) return p.toFixed(4);
  return p.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
