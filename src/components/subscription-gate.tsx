import { useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";

const OPEN_PATHS = ["/auth", "/pricing", "/.lovable/oauth/consent"];

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, loading } = useSession();

  const open = OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  useEffect(() => { if (!open && !loading && !user) navigate({ to: "/auth", search: {}, replace: true }); }, [open, loading, user, navigate]);
  if (open) return <>{children}</>;
  if (loading) return <div className="min-h-[60vh] grid place-items-center text-muted-foreground">Loading account…</div>;
  if (!user) return null;
  return <>{children}</>;
}

export function TrialBanner() {
  return null;
}
