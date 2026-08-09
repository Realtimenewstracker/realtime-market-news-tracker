import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, TrendingUp, TrendingDown, Newspaper, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { listAlerts, markAlertsRead, clearAlerts } from "@/lib/alerts.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function AlertsBell() {
  const { user } = useSession();
  const qc = useQueryClient();
  const listFn = useServerFn(listAlerts);
  const readFn = useServerFn(markAlertsRead);
  const clearFn = useServerFn(clearAlerts);
  const [open, setOpen] = useState(false);

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => listFn(),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  // Live push: new alert rows arrive over realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("alerts-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { kind: string; title: string; body: string | null };
          toast(row.title, { description: row.body ?? undefined });
          qc.invalidateQueries({ queryKey: ["alerts"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const markRead = useMutation({
    mutationFn: () => readFn({ data: { ids: null } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
  const clearAll = useMutation({
    mutationFn: () => clearFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  if (!user) return null;
  const unread = (alerts ?? []).filter((a) => !a.is_read).length;

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && unread > 0) markRead.mutate();
      }}
    >
      <PopoverTrigger asChild>
        <button
          className="glass glass-hover rounded-full w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-foreground relative"
          title="Watchlist alerts"
          aria-label={unread ? `${unread} unread alerts` : "Alerts"}
        >
          <Bell size={15} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-bear text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(340px,calc(100vw-1.5rem))] p-0 glass-strong border-white/70 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/60">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            Watchlist alerts
          </span>
          {(alerts?.length ?? 0) > 0 && (
            <button
              onClick={() => clearAll.mutate()}
              className="text-[11px] text-muted-foreground hover:text-bear flex items-center gap-1"
            >
              <Trash2 size={11} /> Clear
            </button>
          )}
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {(alerts?.length ?? 0) === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No alerts yet. Add symbols or keywords to your watchlist and we'll ping you on big
              moves and high-impact stories.
            </div>
          ) : (
            alerts!.map((a) => <AlertRow key={a.id} a={a} />)
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type Alert = {
  id: string;
  kind: string;
  subject: string;
  title: string;
  body: string | null;
  direction: string | null;
  change_pct: number | null;
  is_read: boolean;
  created_at: string;
};

export function AlertRow({ a }: { a: Alert }) {
  const up = a.direction === "up";
  return (
    <div className={`px-4 py-3 border-b border-white/40 last:border-0 ${a.is_read ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-0.5 shrink-0 ${
            a.kind === "price" ? (up ? "text-bull" : "text-bear") : "text-primary"
          }`}
        >
          {a.kind === "price" ? (
            up ? <TrendingUp size={14} /> : <TrendingDown size={14} />
          ) : (
            <Newspaper size={14} />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            {a.subject}
          </div>
          <div className="text-xs font-medium text-foreground leading-snug">{a.title}</div>
          {a.body && <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{a.body}</div>}
          <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            {!a.is_read && <Check size={9} className="text-bull" />}
            {new Date(a.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
          </div>
        </div>
      </div>
    </div>
  );
}
