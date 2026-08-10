import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ArrowUpRight, RotateCcw, X } from "lucide-react";
import { SentimentBadge, ImpactBadge, type NewsItem } from "./news-card";

const CAT_LABEL: Record<string, string> = {
  stocks: "Stocks", crypto: "Crypto", macro: "Macro",
  forex: "Forex", commodities: "Commodities",
};

export function NewsSwipe({ items, onOpen }: { items: NewsItem[]; onOpen: (n: NewsItem) => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => { setIndex(0); }, [items]);

  const stack = useMemo(() => items.slice(index, index + 3), [items, index]);
  const remaining = Math.max(items.length - index, 0);

  if (!items.length) return null;

  if (!stack.length) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <p className="font-display text-xl text-foreground">You're all caught up</p>
        <p className="mt-1 text-sm text-muted-foreground">You've swiped through every story in this filter.</p>
        <button
          onClick={() => setIndex(0)}
          className="mt-4 inline-flex items-center gap-2 rounded-full glass-btn-primary px-4 py-2 text-sm font-semibold"
        >
          <RotateCcw size={14} /> Start over
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md h-[440px] sm:h-[480px] select-none">
        <AnimatePresence initial={false}>
          {stack
            .map((item, i) => ({ item, i }))
            .reverse()
            .map(({ item, i }) => (
              <SwipeCard
                key={item.id}
                item={item}
                depth={i}
                onOpen={() => onOpen(item)}
                onDismiss={() => setIndex((v) => v + 1)}
              />
            ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => setIndex((v) => v + 1)}
          className="glass glass-hover rounded-full w-12 h-12 flex items-center justify-center text-foreground"
          aria-label="Skip story"
        >
          <X size={18} />
        </button>
        <span className="font-mono text-xs text-muted-foreground min-w-[64px] text-center">
          {remaining} left
        </span>
        <button
          onClick={() => onOpen(stack[0])}
          className="glass-btn-primary rounded-full h-12 px-5 text-sm font-semibold flex items-center gap-1.5"
          aria-label="Open story"
        >
          Read <ArrowUpRight size={16} />
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Swipe left to skip · right to read</p>
    </div>
  );
}

function SwipeCard({
  item, depth, onDismiss, onOpen,
}: { item: NewsItem; depth: number; onDismiss: () => void; onOpen: () => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-14, 14]);
  const skipOpacity = useTransform(x, [-140, -40], [1, 0]);
  const readOpacity = useTransform(x, [40, 140], [0, 1]);

  const timeAgo = (() => {
    try { return formatDistanceToNow(parseISO(item.published_at), { addSuffix: true }); }
    catch { return "just now"; }
  })();

  const impact = item.impact ?? 0;
  const strip =
    impact >= 3 ? "bg-rose-500" :
    impact === 2 ? "bg-blue-500" :
    impact === 1 ? "bg-slate-400/70" : "bg-slate-300/50";

  return (
    <motion.div
      className="absolute inset-0 glass-strong rounded-3xl p-5 md:p-6 flex flex-col gap-3 overflow-hidden touch-pan-y"
      style={{ x: depth === 0 ? x : 0, rotate: depth === 0 ? rotate : 0, zIndex: 10 - depth }}
      initial={{ scale: 0.94, y: 18, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.04, y: depth * 12, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      drag={depth === 0 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (info.offset.x < -110) onDismiss();
        else if (info.offset.x > 110) { onOpen(); onDismiss(); }
      }}
    >
      <div className={`absolute inset-x-0 top-0 h-[3px] ${strip}`} />

      {depth === 0 && (
        <>
          <motion.span
            style={{ opacity: skipOpacity }}
            className="absolute top-6 right-5 rotate-12 rounded-xl border-2 border-rose-500/70 px-3 py-1 text-xs font-bold tracking-widest text-rose-500"
          >
            SKIP
          </motion.span>
          <motion.span
            style={{ opacity: readOpacity }}
            className="absolute top-6 left-5 -rotate-12 rounded-xl border-2 border-emerald-500/70 px-3 py-1 text-xs font-bold tracking-widest text-emerald-600"
          >
            READ
          </motion.span>
        </>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold shrink-0">
            {CAT_LABEL[item.category] ?? item.category}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-[11px] text-muted-foreground font-medium truncate">{item.source}</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground shrink-0">{timeAgo}</span>
      </div>

      <h3 className="font-display text-xl md:text-2xl font-semibold leading-snug tracking-tight text-foreground break-words line-clamp-4">
        {item.title}
      </h3>

      {(item.ai_summary || item.summary) && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
          {item.ai_summary || (item.summary ?? "").replace(/<[^>]+>/g, "").trim()}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
        <SentimentBadge sentiment={item.sentiment} />
        <ImpactBadge impact={impact} />
        {item.tickers?.slice(0, 3).map((t) => (
          <span key={t} className="px-2 py-0.5 glass-chip font-mono text-[10px] text-foreground">{t}</span>
        ))}
      </div>
    </motion.div>
  );
}
