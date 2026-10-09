const preferenceKey = (userId: string) => `trackindia.browser-notifications.enabled.${userId}`;

export function browserNotificationState(userId: string | undefined) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { supported: false, permission: "unsupported" as const, enabled: false };
  }
  let enabled = false;
  try {
    enabled = !!userId && Notification.permission === "granted" && localStorage.getItem(preferenceKey(userId)) === "true";
  } catch {
    enabled = false;
  }
  return {
    supported: true,
    permission: Notification.permission,
    enabled,
  };
}

export function setBrowserNotificationsEnabled(userId: string, enabled: boolean) {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(preferenceKey(userId), enabled ? "true" : "false");
    return true;
  } catch {
    return false;
  }
}

export function showBrowserAlertNotification(userId: string, alert: { id: string; title: string; body: string | null }) {
  const state = browserNotificationState(userId);
  if (!state.supported || !state.enabled) return;
  try {
    const notification = new Notification(alert.title, {
      body: alert.body?.slice(0, 180) ?? "Open TrackIndia to view this watchlist alert.",
      icon: "/icon-192.png",
      tag: `trackindia-alert-${alert.id}`,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Keep the in-app alert available if the browser rejects an OS notification.
  }
}
