import { useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Paywall } from "@/components/paywall";

const OPEN_PATHS = ["/auth", "/pricing", "/.lovable/oauth/consent"];

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { subscription, loading, signedIn } = useSubscription();

  const open = OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const account = pathname === "/account";
  useEffect(() => { if (!open && !loading && !signedIn) navigate({ to: "/auth", replace: true }); }, [open, loading, signedIn, navigate]);
  if (open) return <>{children}</>;
  if (loading) return <div className="min-h-[60vh] grid place-items-center text-muted-foreground">Loading account…</div>;
  if (!signedIn) return null;
  if (account) return <>{children}</>;
  if (!subscription) return <div role="alert" className="p-8 text-center text-destructive">Membership status unavailable. Please try again.</div>;
  if (subscription.active) return <>{children}</>;
  return <Paywall />;
}

export function TrialBanner() {
  const { subscription } = useSubscription();
  if (!subscription?.in_trial) return null;
  return (
    <div className="px-3 md:px-8 pt-3">
      <div className="glass rounded-2xl px-4 py-2 text-center text-xs text-foreground/80">
        Free trial ends in {subscription.days_left} day{subscription.days_left === 1 ? "" : "s"} —{" "}
        <a href="/pricing" className="font-semibold text-accent">
           view plans
        </a>
      </div>
    </div>
  );
}
