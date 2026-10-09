import { useEffect, useState } from "react";
import { BellRing, BellOff, Bell } from "lucide-react";
import { toast } from "sonner";
import { browserNotificationState, setBrowserNotificationsEnabled } from "@/lib/browser-notifications";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

type State = ReturnType<typeof browserNotificationState>;

export function BrowserNotificationControl() {
  const { user } = useSession();
  const [state, setState] = useState<State>({ supported: false, permission: "unsupported", enabled: false });

  useEffect(() => setState(browserNotificationState(user?.id)), [user?.id]);

  const enableOrToggle = async () => {
    if (!state.supported || !user) return;
    if (state.permission === "denied") {
      toast.info("Notifications are blocked in this browser", { description: "Allow notifications for trackmarket.live in your browser settings first." });
      return;
    }
    let permission = state.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setState(browserNotificationState(user.id));
      toast.info("Notification permission was not granted");
      return;
    }
    const enabled = !state.enabled;
    if (!setBrowserNotificationsEnabled(user.id, enabled)) {
      toast.error("This browser could not save the notification preference");
      return;
    }
    setState(browserNotificationState(user.id));
    toast.success(enabled ? "Browser notifications enabled" : "Browser notifications paused", {
      description: "This device receives new alerts while TrackIndia is open.",
    });
  };

  const label = !state.supported
    ? "Browser notifications unavailable"
    : state.permission === "denied"
      ? "Notifications blocked in browser"
      : state.enabled
        ? "Browser notifications on"
        : "Enable browser notifications";

  return (
    <div className="border-t border-border/60 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium">
            {state.enabled ? <BellRing size={14} className="text-primary" /> : state.supported ? <Bell size={14} className="text-muted-foreground" /> : <BellOff size={14} className="text-muted-foreground" />}
            <span>{label}</span>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">Alerts appear on this device while TrackIndia is open. Background push is not configured yet.</p>
        </div>
        {state.supported && <Button type="button" variant={state.enabled ? "outline" : "default"} size="sm" onClick={() => void enableOrToggle()} className="shrink-0 rounded-full px-3">
          {state.enabled ? "Pause" : state.permission === "denied" ? "How to allow" : "Enable"}
        </Button>}
      </div>
    </div>
  );
}
