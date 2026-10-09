import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { showBrowserAlertNotification } from "@/lib/browser-notifications";

export function AlertRealtimeBridge() {
  const { user } = useSession();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`alerts-stream-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` }, (payload) => {
        const row = payload.new as { id: string; title: string; body: string | null };
        toast(row.title, { description: row.body ?? undefined });
        showBrowserAlertNotification(user.id, row);
        qc.invalidateQueries({ queryKey: ["alerts"] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, qc]);

  return null;
}
