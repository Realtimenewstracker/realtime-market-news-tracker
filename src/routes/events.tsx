import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getUpcomingEvents } from "@/lib/market.functions";

export const Route = createFileRoute("/events")({ head: () => ({ meta: [
  { title: "Upcoming Market Events — TrackIndia" }, { name: "description", content: "Upcoming NSE board meetings, results, dividends, splits and bonuses by date." },
  { property: "og:title", content: "Upcoming Market Events — TrackIndia" }, { property: "og:description", content: "Dated corporate actions and board meetings from NSE." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: EventsPage });

export function EventsPage() {
  const fn = useServerFn(getUpcomingEvents);
  const { data, isPending, isError } = useQuery({ queryKey: ["nse-events"], queryFn: () => fn(), refetchInterval: 300_000, staleTime: 120_000 });
  return <section className="max-w-5xl mx-auto px-3 md:px-8 py-7">
    <h1 className="font-display text-3xl font-semibold">Upcoming events</h1>
    <p className="text-sm text-muted-foreground mt-1">Results, meetings, dividends, splits and bonuses · NSE</p>
    {isPending ? <p className="mt-6">Loading exchange calendar…</p> : isError ? <p role="alert" className="mt-6 text-destructive">Exchange calendar unavailable. Try again later.</p> :
      data?.length ? <div className="mt-6 divide-y divide-border">{data.map((event, index) => <article key={`${event.symbol}-${event.date}-${index}`} className="py-4 grid grid-cols-[5rem_1fr] sm:grid-cols-[7rem_1fr] gap-3">
        <time dateTime={event.date ?? undefined} className="font-mono text-xs text-muted-foreground pt-1">{event.date ? new Date(`${event.date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</time>
        <div className="min-w-0"><span className="text-[10px] font-semibold uppercase text-accent">{event.kind}</span><h2 className="font-semibold text-foreground">{event.company} <span className="font-mono text-xs text-muted-foreground">{event.symbol}</span></h2><p className="text-xs text-muted-foreground line-clamp-2">{event.detail}</p><a href={event.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent">NSE filing ↗</a></div>
      </article>)}</div> : <p className="mt-6 text-muted-foreground">No upcoming events available from the exchange.</p>}
  </section>;
}