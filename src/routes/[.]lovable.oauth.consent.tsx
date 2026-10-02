import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { OAuthAuthorizationDetails } from "@supabase/auth-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id: typeof search.authorization_id === "string" ? search.authorization_id : "",
  }),
  head: () => ({ meta: [
    { title: "Approve connection — TrackIndia" },
    { name: "description", content: "Review an assistant's request to connect to your TrackIndia account." },
    { property: "og:title", content: "Approve connection — TrackIndia" },
    { property: "og:description", content: "Review access to your TrackIndia account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Consent,
});

function Consent() {
  const { authorization_id } = Route.useSearch();
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!authorization_id) { setError("This connection request is missing or expired."); setLoading(false); return; }
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session.session) {
          const next = `${window.location.pathname}${window.location.search}`;
          window.location.assign(`/auth?next=${encodeURIComponent(next)}`);
          return;
        }
        const { data, error: detailsError } = await supabase.auth.oauth.getAuthorizationDetails(authorization_id);
        if (detailsError) throw detailsError;
        if (data && "redirect_url" in data) { window.location.assign(data.redirect_url); return; }
        if (!cancelled) setDetails(data ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this connection request.");
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [authorization_id]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError("");
    try {
      const result = approve
        ? await supabase.auth.oauth.approveAuthorization(authorization_id, { skipBrowserRedirect: true })
        : await supabase.auth.oauth.denyAuthorization(authorization_id, { skipBrowserRedirect: true });
      if (result.error) throw result.error;
      if (!result.data?.redirect_url) throw new Error("No return address was provided by the connection service.");
      window.location.assign(result.data.redirect_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The connection request could not be completed.");
      setBusy(false);
    }
  }

  return <main className="mx-auto max-w-lg px-5 py-16 text-foreground">
    <h1 className="font-display text-2xl font-semibold">Connect to TrackIndia</h1>
    {loading && <p className="mt-5 text-muted-foreground">Loading request…</p>}
    {details && <>
      <p className="mt-4 text-muted-foreground"><strong className="text-foreground">{details.client.name}</strong> wants to access market headlines and your watchlist as you.</p>
      <p className="mt-3 text-sm text-muted-foreground">Signed in as {details.user.email}. You can deny this request.</p>
      <div className="mt-7 flex gap-3">
        <Button disabled={busy} onClick={() => void decide(true)}>Approve</Button>
        <Button disabled={busy} variant="outline" onClick={() => void decide(false)}>Deny</Button>
      </div>
    </>}
    {error && <p role="alert" className="mt-5 text-destructive">{error}</p>}
  </main>;
}