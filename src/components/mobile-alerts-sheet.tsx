import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Trash2 } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { listAlerts, markAlertsRead, clearAlerts } from "@/lib/alerts.functions";
import { AlertRow } from "@/components/alerts-bell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MobileAlertsDockItem() {
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

  const markRead = useMutation({
    mutationFn: () => readFn({ data: { ids: null } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
  const clearAll = useMutation({
    mutationFn: () => clearFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const unread = (alerts ?? []).filter((a) => !a.is_read).length;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && unread > 0) markRead.mutate();
      }}
    >
      <SheetTrigger asChild>
        <button
          className="relative min-h-9 px-3 py-1.5 rounded-full text-xs font-medium text-foreground/70 flex items-center gap-1"
          aria-label={unread ? `${unread} unread alerts` : "Alerts"}
        >
          <Bell size={13} />
          Alerts
          {unread > 0 && (
            <span className="absolute -top-0.5 right-0 min-w-[16px] h-[16px] px-1 rounded-full bg-bear text-white text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="glass-strong border-white/70 rounded-t-3xl p-0 max-h-[80dvh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/60">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            Watchlist alerts
          </span>
          {(alerts?.length ?? 0) > 0 && (
            <button
              onClick={() => clearAll.mutate()}
              className="text-[11px] text-muted-foreground hover:text-bear flex items-center gap-1 mr-8"
            >
              <Trash2 size={11} /> Clear
            </button>
          )}
        </div>
        <div className="overflow-y-auto max-h-[62dvh] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {!user ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Sign in to get price and news alerts for your watchlist.
            </div>
          ) : (alerts?.length ?? 0) === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No alerts yet. Add symbols or keywords to your watchlist.
            </div>
          ) : (
            alerts!.map((a) => <AlertRow key={a.id} a={a} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
