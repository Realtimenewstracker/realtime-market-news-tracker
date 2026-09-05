import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Paywall } from "@/components/paywall";

const OPEN_PATHS = ["/auth", "/pricing", "/account"];

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { subscription, loading, signedIn } = useSubscription();

  const open = OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (open || !signedIn || loading || !subscription || subscription.active) return <>{children}</>;
  return <Paywall />;
}

export function TrialBanner() {
  const { subscription } = useSubscription();
  if (!subscription?.in_trial || subscription.days_left > 3) return null;
  return (
    <div className="px-3 md:px-8 pt-3">
      <div className="glass rounded-2xl px-4 py-2 text-center text-xs text-foreground/80">
        Free trial ends in {subscription.days_left} day{subscription.days_left === 1 ? "" : "s"} —{" "}
        <a href="/pricing" className="font-semibold text-accent">
          choose a plan
        </a>
      </div>
    </div>
  );
}
