import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getLiveIpos, getUpcomingEvents } from "@/lib/market.functions";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/events")({ head: () => ({ meta: [
  { title: "Upcoming Market Events — TrackIndia" }, { name: "description", content: "NSE corporate actions, board meetings and IPO milestones in one dated market calendar." },
  { property: "og:title", content: "Upcoming Market Events — TrackIndia" }, { property: "og:description", content: "Dated corporate actions, board events and IPO milestones from NSE." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: EventsPage });

function EventsPage() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const fn = useServerFn(getUpcomingEvents);
  const ipoFn = useServerFn(getLiveIpos);
  const { data, isPending, isError } = useQuery({ queryKey: ["nse-events"], queryFn: () => fn(), refetchInterval: 300_000, staleTime: 120_000 });
  const { data: ipos, isPending: iposPending, isError: iposError } = useQuery({ queryKey: ["live-ipos"], queryFn: () => ipoFn(), refetchInterval: 300_000, staleTime: 120_000 });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  type CalendarEvent = { date: string | null; kind: string; company: string; symbol: string; detail: string; url: string; source: string };
  const calendarEvents: CalendarEvent[] = [
    ...(data ?? []).map((event) => ({ ...event, source: "NSE corporate filings" })),
    ...(ipos?.issues ?? []).flatMap((ipo) => {
      const milestones: CalendarEvent[] = [];
      const priceBand = ipo.priceBand !== "Not announced" ? ` · Price band ${ipo.priceBand}` : "";
      if (ipo.openDate && ipo.openDate >= today) milestones.push({ date: ipo.openDate, kind: "IPO opens", company: ipo.name, symbol: ipo.symbol ?? "—", detail: `${ipo.board} issue opens${priceBand}`, url: ipo.url, source: "NSE IPO feed" });
      if (ipo.closeDate && ipo.closeDate >= today) milestones.push({ date: ipo.closeDate, kind: "IPO closes", company: ipo.name, symbol: ipo.symbol ?? "—", detail: `${ipo.board} issue closes${priceBand}`, url: ipo.url, source: "NSE IPO feed" });
      return milestones;
    }),
  ].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const kinds = [...new Set(calendarEvents.map((event) => event.kind))].sort();
  const filtered = calendarEvents.filter((event) => {
    const matchesKind = kind === "all" || event.kind === kind;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${event.company} ${event.symbol} ${event.detail} ${event.kind}`.toLowerCase().includes(term);
    return matchesKind && matchesSearch;
  });
  return <section className="max-w-5xl mx-auto px-3 md:px-8 py-7">
    <h1 className="font-display text-3xl font-semibold">Upcoming events</h1>
    <p className="text-sm text-muted-foreground mt-1">NSE corporate actions, board events and IPO milestones in one dated view. Check the source filing before acting on a date.</p>
    <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, symbol or event" aria-label="Search exchange events" />
      <select aria-label="Filter event type" value={kind} onChange={(event) => setKind(event.target.value)} className="min-h-10 rounded-xl border border-border bg-background px-3 text-sm">
        <option value="all">All event types</option>
        {kinds.map((eventKind) => <option key={eventKind} value={eventKind}>{eventKind}</option>)}
      </select>
    </div>
    {isPending && iposPending ? <p className="mt-6">Loading exchange calendar…</p> : isError && iposError ? <p role="alert" className="mt-6 text-destructive">Exchange event data is unavailable. Try again later.</p> : <>
      {(isError || iposError) && <p role="status" className="mt-4 text-xs text-muted-foreground">One NSE feed is unavailable; showing events from the source that responded.</p>}
      {filtered.length ? <div className="mt-6 divide-y divide-border">{filtered.map((event, index) => <article key={`${event.symbol}-${event.date}-${event.kind}-${index}`} className="py-4 grid grid-cols-[5rem_1fr] sm:grid-cols-[7rem_1fr] gap-3">
        <time dateTime={event.date ?? undefined} className="font-mono text-xs text-muted-foreground pt-1">{event.date ? new Date(`${event.date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</time>
        <div className="min-w-0"><span className="text-[10px] font-semibold uppercase text-accent">{event.kind}</span><h2 className="font-semibold text-foreground">{event.company} <span className="font-mono text-xs text-muted-foreground">{event.symbol}</span></h2><p className="text-xs text-muted-foreground line-clamp-2">{event.detail}</p><a href={event.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent">{event.source} ↗</a></div>
      </article>)}</div> : calendarEvents.length > 0 ? <p className="mt-6 text-muted-foreground">No exchange events match these filters.</p> : <p className="mt-6 text-muted-foreground">No upcoming events available from the exchange.</p>}
    </>}
  </section>;
}
