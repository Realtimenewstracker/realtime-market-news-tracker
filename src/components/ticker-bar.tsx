import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type Ticker = {
  symbol: string;
  alias: string;
  label: string;
  kind: string;
  last: number | null;
  change: number | null;
  change_pct: number | null;
};

const PLACEHOLDER: Ticker[] = [
  { symbol: "NIFTY", alias: "NIFTY", label: "NIFTY 50", kind: "index", last: 24812.05, change: null, change_pct: 0.32 },
  { symbol: "SENSEX", alias: "SENSEX", label: "SENSEX", kind: "index", last: 81214.7, change: null, change_pct: 0.28 },
  { symbol: "BANKNIFTY", alias: "BANKNIFTY", label: "BANK NIFTY", kind: "index", last: 55842.1, change: null, change_pct: -0.14 },
  { symbol: "BTC", alias: "BTC", label: "BITCOIN", kind: "crypto", last: 96420, change: null, change_pct: 1.84 },
];

export function TickerBar({ tickers }: { tickers: Ticker[] }) {
  // Client-side auto refresh every 60s
  const [items, setItems] = useState<Ticker[]>(tickers?.length ? tickers : PLACEHOLDER);
  useEffect(() => {
    if (tickers?.length) setItems(tickers);
  }, [tickers]);
  useEffect(() => {
    const int = setInterval(() => {
      fetch("/api/public/refresh-tickers", { method: "POST" }).catch(() => {});
    }, 120_000);
    return () => clearInterval(int);
  }, []);

  const doubled = [...items, ...items];
  return (
    <div className="glass-strong border-b border-white/70 py-2.5 marquee-mask overflow-hidden sticky top-0 z-40">
      <div className="marquee-track">
        {doubled.map((t, i) => (
          <TickerPill key={`${t.symbol}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}

function TickerPill({ t }: { t: Ticker }) {
  const pct = t.change_pct ?? 0;
  const up = pct >= 0;
  return (
    <div className="mx-3 flex items-center gap-2.5 px-4 py-1.5 rounded-full glass shrink-0">
      <span className="font-display font-semibold tracking-tight text-foreground text-sm">
        {t.label || t.alias}
      </span>
      <span className="font-mono text-foreground text-sm">{fmt(t.last, t.kind)}</span>
      <span className={`font-mono text-xs flex items-center gap-1 ${up ? "text-bull" : "text-bear"}`}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {up ? "+" : ""}
        {pct.toFixed(2)}%
      </span>
    </div>
  );
}

function fmt(p: number | null, kind: string) {
  if (p == null || Number.isNaN(p)) return "—";
  if (kind === "crypto" && p < 5) return p.toFixed(4);
  return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
