import { useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { PublicHome } from "@/components/public-home";

const OPEN_PATHS = ["/auth", "/pricing", "/about", "/privacy", "/contact", "/cancellation", "/.lovable/oauth/consent"];

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, loading } = useSession();

  const isHome = pathname === "/";
  const open = OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  useEffect(() => { if (!open && !isHome && !loading && !user) navigate({ to: "/auth", search: {}, replace: true }); }, [open, isHome, loading, user, navigate]);
  if (open) return <>{children}</>;
  // Signed-out visitors (and crawlers, which never have a session) see the public home page.
  if (isHome && !user) return <PublicHome />;
  if (loading) return <div className="min-h-[60vh] grid place-items-center text-muted-foreground">Loading account…</div>;
  if (!user) return null;
  return <>{children}</>;
}

export function TrialBanner() {
  return null;
}
