import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — TrackIndia" },
      { name: "description", content: "Your TrackIndia account settings." },
        { property: "og:title", content: "Account — TrackIndia" },
        { property: "og:description", content: "Manage your TrackIndia details and subscription." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user)
    return (
      <section className="max-w-md mx-auto mt-16 px-4 text-center glass-strong rounded-3xl p-8">
        <h1 className="font-display text-2xl">You're signed out</h1>
        <Link to="/auth" search={{}} className="inline-block mt-4 rounded-full glass-btn-primary px-4 py-2 text-sm font-semibold">Sign in</Link>
      </section>
    );

  return (
    <section className="max-w-md mx-auto mt-16 px-4">
      <div className="glass-strong rounded-3xl p-8">
        <h1 className="font-display text-2xl font-semibold">Account</h1><h2 className="mt-4 text-xs uppercase text-muted-foreground font-semibold">Basic details</h2>
        <div className="mt-4 space-y-2 text-sm">
          <Row label="Email" value={user.email ?? "—"} />
        </div><h2 className="mt-6 text-xs uppercase text-muted-foreground font-semibold">Subscription</h2><div className="mt-2 space-y-2 text-sm">
          <Row
            label="Membership"
            value={
              "Free access · no end date announced"
            }
          />
        </div>
        <Link
          to="/pricing"
          className="mt-4 block w-full rounded-full glass-btn px-4 py-2 text-center text-sm font-semibold"
        >
          View future plans
        </Link>
        <Button
          onClick={async () => {
            await supabase.auth.signOut();
             await router.invalidate();
             toast.success("Signed out");
             navigate({ to: "/auth", search: {}, replace: true });
          }}
          className="mt-6 w-full rounded-full glass-btn-primary px-4 py-2 text-sm font-semibold"
        >
          Sign out
        </Button>
      </div>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/60 pb-2">
      <span className="shrink-0 text-muted-foreground text-xs uppercase tracking-widest font-semibold">{label}</span>
      <span className={`text-foreground text-xs ${mono ? "font-mono" : ""} truncate`}>{value}</span>
    </div>
  );
}
