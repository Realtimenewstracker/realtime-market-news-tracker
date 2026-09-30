import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listNews } from "@/lib/data.functions";
import { NewsCard, type NewsItem } from "@/components/news-card";
import { NewsDetail } from "@/components/news-detail";

export function MarketNewsSection({ title, category, keywords }: { title: string; category?: string; keywords?: string[] }) {
  const fn = useServerFn(listNews);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const { data, isPending, isError } = useQuery({ queryKey: ["section-news", title], queryFn: () => fn({ data: { category, keywords, limit: 36 } }), refetchInterval: 60_000, refetchIntervalInBackground: false });
  return <section className="max-w-7xl mx-auto px-3 md:px-8 py-7">
    <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
    <p className="text-sm text-muted-foreground mt-1">Latest sourced headlines affecting Indian markets</p>
    {isError ? <p role="alert" className="mt-6 text-sm text-destructive">Headlines are unavailable right now.</p> :
      isPending ? <p className="mt-6 text-muted-foreground">Loading headlines…</p> :
      data?.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">{data.map((n) => <NewsCard key={n.id} item={n as NewsItem} onClick={() => setSelected(n as NewsItem)} />)}</div> :
      <p className="mt-6 text-muted-foreground">No recent verified headlines in this section.</p>}
    <NewsDetail item={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
  </section>;
}