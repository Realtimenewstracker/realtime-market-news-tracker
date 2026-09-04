import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, ExternalLink } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { SentimentBadge, ImpactBadge, type NewsItem } from "./news-card";

export function NewsDetail({
  item, open, onOpenChange,
}: {
  item: NewsItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!item) return null;
  const timeAgo = (() => { try { return formatDistanceToNow(parseISO(item.published_at), { addSuffix: true }); } catch { return ""; } })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-strong border-white/80 max-h-[80dvh] pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-6">
        <DialogHeader className="pr-10 text-left">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2 text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
            <span>{item.category}</span>
            <span>·</span>
            <span>{item.source}</span>
            <span>·</span>
            <span>{timeAgo}</span>
          </div>
          <DialogTitle className="font-display text-lg md:text-xl leading-snug text-left break-words">{item.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <SentimentBadge sentiment={item.sentiment} />
          <ImpactBadge impact={item.impact ?? 0} />
          {item.tickers?.map((t) => (
            <span key={t} className="px-2 py-0.5 glass-chip font-mono text-[10px]">
              {t}
            </span>
          ))}
          {item.regions?.map((r) => (
            <span key={r} className="px-2 py-0.5 rounded-full bg-accent-tint font-mono text-[10px]">
              {r}
            </span>
          ))}
        </div>
        {item.ai_summary && (
          <div className="mt-3 p-4 glass-card rounded-2xl">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1 flex items-center gap-1">
              <Sparkles size={12} /> AI summary
            </div>
            <p className="text-sm leading-relaxed text-foreground">{item.ai_summary}</p>
          </div>
        )}
        {item.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
            {item.summary.replace(/<[^>]+>/g, "").trim()}
          </p>
        )}
        <a
          href={item.url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          Read the full story <ExternalLink size={13} />
        </a>

      </DialogContent>
    </Dialog>
  );
}
