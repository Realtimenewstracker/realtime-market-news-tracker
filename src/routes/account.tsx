import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — TrackIndia" },
      { name: "description", content: "Your TrackIndia account settings." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useSession();
  const router = useRouter();

  if (loading) return null;
  if (!user)
    return (
      <section className="max-w-md mx-auto mt-16 px-4 text-center glass-strong rounded-3xl p-8">
        <h1 className="font-display text-2xl">You're signed out</h1>
        <Link to="/auth" className="inline-block mt-4 rounded-full glass-btn-primary px-4 py-2 text-sm font-semibold">Sign in</Link>
      </section>
    );

  return (
    <section className="max-w-md mx-auto mt-16 px-4">
      <div className="glass-strong rounded-3xl p-8">
        <h1 className="font-display text-2xl font-semibold">Account</h1>
        <div className="mt-4 space-y-2 text-sm">
          <Row label="Email" value={user.email ?? "—"} />
          <Row label="User ID" value={user.id} mono />
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
            router.navigate({ to: "/" });
          }}
          className="mt-6 w-full rounded-full glass-btn-primary px-4 py-2 text-sm font-semibold"
        >
          Sign out
        </button>
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
