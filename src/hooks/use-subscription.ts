import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySubscription } from "@/lib/subscription.functions";
import { useSession } from "@/hooks/use-session";

export function useSubscription() {
  const { user, loading } = useSession();
  const fn = useServerFn(getMySubscription);
  const q = useQuery({
    queryKey: ["subscription", user?.id ?? "anon"],
    queryFn: () => fn(),
    enabled: !!user,
    staleTime: 60_000,
  });
  return {
    subscription: q.data ?? null,
    loading: loading || (!!user && q.isLoading),
    signedIn: !!user,
  };
}
