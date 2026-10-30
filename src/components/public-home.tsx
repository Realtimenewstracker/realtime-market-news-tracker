import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Newspaper, Rocket, CalendarDays, Landmark, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTodayTopNews } from "@/lib/data.functions";
import { getLiveIpos, getUpcomingEvents } from "@/lib/market.functions";

const FEATURES = [
  { icon: Newspaper, title: "Market-moving news", text: "Indian and global headlines tagged by impact and mood, with short AI summaries." },
  { icon: Rocket, title: "IPO tracker", text: "Live NSE issues with price bands, dates and subscription." },
  { icon: CalendarDays, title: "Events calendar", text: "Results, dividends, splits and bonuses by date." },
  { icon: Landmark, title: "Policy & geopolitics", text: "Government, RBI and world news that can move Indian stocks." },
  { icon: Bell, title: "Watchlist alerts", text: "Get notified when your stocks or IPOs make news." },
];

function fmtDate(d: string | null) {
  if (!d) return "Date TBA";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Unavailable({ what }: { what: string }) {
  return <p className="text-sm text-muted-foreground">{what} is temporarily unavailable.</p>;
}

function SignupButton({ label = "Create free account" }: { label?: string }) {
  return (
    <Button asChild size="lg">
      <Link to="/auth" search={{ mode: "signup" }}>{label} <ArrowRight className="ml-1 h-4 w-4" /></Link>
    </Button>
  );
}

export function PublicHome() {
  const newsFn = useServerFn(listTodayTopNews);
  const iposFn = useServerFn(getLiveIpos);
  const eventsFn = useServerFn(getUpcomingEvents);
  const news = useQuery({ queryKey: ["public-top-news"], queryFn: () => newsFn(), staleTime: 300_000, retry: false });
  const ipos = useQuery({ queryKey: ["public-ipos"], queryFn: () => iposFn(), staleTime: 300_000, retry: false });
  const events = useQuery({ queryKey: ["public-events"], queryFn: () => eventsFn(), staleTime: 300_000, retry: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-14 space-y-10">
      <section className="glass-strong rounded-3xl p-6 md:p-10 text-center space-y-5">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">News that moves Indian stocks, as it happens</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
          TrackIndia brings Indian and global market news, live IPOs, and results and dividend dates into one fast, ad-free feed for traders and investors.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <SignupButton />
          <Button asChild size="lg" variant="outline"><Link to="/auth" search={{}}>Sign in</Link></Button>
        </div>
        <p className="text-xs text-muted-foreground">Free for registered users. No card needed.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="glass rounded-2xl p-4 space-y-2">
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 space-y-3 lg:col-span-1">
          <h2 className="font-semibold flex items-center gap-2"><Newspaper className="h-4 w-4 text-primary" /> Today's top stories</h2>
          {news.isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : news.isError ? <Unavailable what="News" /> : news.data.length === 0 ? <p className="text-sm text-muted-foreground">No major stories yet today.</p> : (
            <ul className="space-y-3">
              {news.data.map((n) => (
                <li key={n.id} className="text-sm">
                  <a href={n.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">{n.title}</a>
                  <div className="text-xs text-muted-foreground">{n.source}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" /> Live IPOs (NSE)</h2>
          {ipos.isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : ipos.isError ? <Unavailable what="IPO data" /> : ipos.data.length === 0 ? <p className="text-sm text-muted-foreground">No open issues right now.</p> : (
            <ul className="space-y-3">
              {ipos.data.slice(0, 5).map((i) => (
                <li key={i.symbol ?? i.name} className="text-sm flex justify-between gap-3">
                  <span className="min-w-0"><span className="font-medium block truncate">{i.name}</span><span className="text-xs text-muted-foreground">{i.board} · {i.priceBand.replace(/Rs\.?\s*/g, "₹")}</span></span>
                  <span className="text-xs text-muted-foreground shrink-0">{fmtDate(i.openDate)}–{fmtDate(i.closeDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Upcoming events</h2>
          {events.isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : events.isError ? <Unavailable what="Events data" /> : events.data.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming events listed.</p> : (
            <ul className="space-y-3">
              {events.data.slice(0, 6).map((e, idx) => (
                <li key={`${e.symbol}-${e.date}-${idx}`} className="text-sm flex justify-between gap-3">
                  <span className="min-w-0"><span className="font-medium block truncate">{e.company}</span><span className="text-xs text-muted-foreground">{e.kind}</span></span>
                  <span className="text-xs text-muted-foreground shrink-0">{fmtDate(e.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="glass-strong rounded-3xl p-6 md:p-8 text-center space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold">See the full feed, alerts and your watchlist</h2>
        <SignupButton label="Create free account" />
        <p className="text-xs text-muted-foreground"><Link to="/about" className="underline">About TrackIndia</Link></p>
      </section>
    </div>
  );
}
