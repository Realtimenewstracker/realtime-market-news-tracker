import { formatDistanceToNow, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react";

export type NewsItem = {
  id: string;
  source: string;
  category: string;
  title: string;
  url: string;
  summary: string | null;
  ai_summary: string | null;
  impact: number | null;
  sentiment: string | null;
  tickers: string[] | null;
  regions: string[] | null;
  published_at: string;
  duplicate_count?: number;
  duplicate_sources?: string[];
};


const CAT_LABEL: Record<string, string> = {
  stocks: "Stocks", crypto: "Crypto", macro: "Macro",
  forex: "Forex", commodities: "Commodities",
};

export function NewsCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  const timeAgo = safeTimeAgo(item.published_at);
  const impact = item.impact ?? 0;
  const strip =
    impact >= 3 ? "bg-rose-500" :
    impact === 2 ? "bg-blue-500" :
    impact === 1 ? "bg-slate-400/70" : "bg-slate-300/50";
  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      className="text-left w-full h-full glass glass-hover rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden"
    >
      <div className={`absolute inset-x-0 top-0 h-[3px] rounded-t-3xl ${strip}`} />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">
            {CAT_LABEL[item.category] ?? item.category}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[160px]">
            {item.source}
          </span>
          {!!item.duplicate_count && (
            <span
              title={(item.duplicate_sources ?? []).join(", ")}
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/60 border border-white/70 text-muted-foreground shrink-0"
            >
              +{item.duplicate_count} {item.duplicate_count === 1 ? "wire" : "wires"}
            </span>
          )}
        </div>

      <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground line-clamp-3">
        {item.title}
      </h3>
      {(item.ai_summary || item.summary) && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {item.ai_summary || strip_html(item.summary ?? "")}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <SentimentBadge sentiment={item.sentiment} />
          <ImpactBadge impact={impact} />
          {item.tickers?.slice(0, 3).map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-white/70 border border-white/80 font-mono text-[10px] text-foreground">
              {t}
            </span>
          ))}
        </div>
        <ArrowUpRight size={16} className="text-muted-foreground" />
      </div>
    </motion.button>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (sentiment === "bullish")
    return (
      <span className="bg-bull-tint rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1">
        <TrendingUp size={11} /> BULL
      </span>
    );
  if (sentiment === "bearish")
    return (
      <span className="bg-bear-tint rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1">
        <TrendingDown size={11} /> BEAR
      </span>
    );
  return (
    <span className="bg-neu-tint rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1">
      <Minus size={11} /> NEUTRAL
    </span>
  );
}

export function ImpactBadge({ impact }: { impact: number }) {
  const label = impact >= 3 ? "HIGH" : impact === 2 ? "MED" : impact === 1 ? "LOW" : "OBS";
  const tone = impact >= 3 ? "bg-accent-tint" : "bg-white/70 text-foreground border border-white/80";
  return (
    <span className={`${tone} rounded-full px-2.5 py-0.5 text-[10px] font-semibold font-mono`}>
      {label}
    </span>
  );
}

function safeTimeAgo(iso: string) {
  try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }); }
  catch { return "just now"; }
}
function strip_html(s: string) { return s.replace(/<[^>]+>/g, "").trim(); }
