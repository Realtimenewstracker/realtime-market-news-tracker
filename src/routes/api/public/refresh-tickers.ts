import { createFileRoute } from "@tanstack/react-router";
import { TICKER_SYMBOLS } from "@/lib/rss-sources";
import { requireCronSecret } from "@/lib/cron-auth.server";

export const Route = createFileRoute("/api/public/refresh-tickers")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await requireCronSecret(request);
        if (unauthorized) return unauthorized;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const rows: Array<{ symbol: string; alias: string; label: string; kind: string; last: number | null; change: number | null; change_pct: number | null; updated_at: string }> = [];
        const now = new Date().toISOString();

        // Yahoo Finance chart API (per-symbol, v8 works without auth)
        await Promise.all(
          TICKER_SYMBOLS.yahoo.map(async (t) => {
            try {
              const res = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t.symbol)}`,
                { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(6000) },
              );
              if (!res.ok) { console.warn(`[tickers] yahoo ${t.symbol} status=${res.status} body=${(await res.text()).slice(0,150)}`); return; }
              const data = (await res.json()) as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number } }> } };
              const meta = data.chart?.result?.[0]?.meta;
              const last = meta?.regularMarketPrice ?? null;
              const prev = meta?.chartPreviousClose ?? meta?.previousClose ?? null;
              const change = last != null && prev != null ? last - prev : null;
              const pct = last != null && prev ? (change! / prev) * 100 : null;
              rows.push({
                symbol: t.symbol, alias: t.alias, label: t.label, kind: t.kind,
                last, change, change_pct: pct, updated_at: now,
              });
            } catch (e) { console.warn(`[tickers] yahoo ${t.symbol} failed`, e); }
          }),
        );

        // CoinGecko
        try {
          const ids = TICKER_SYMBOLS.coingecko.map((t) => t.coingecko).join(",");
          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
            { signal: AbortSignal.timeout(8000) },
          );
          if (res.ok) {
            const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
            for (const t of TICKER_SYMBOLS.coingecko) {
              const q = data[t.coingecko];
              const last = q?.usd ?? null;
              const pct = q?.usd_24h_change ?? null;
              rows.push({
                symbol: t.symbol, alias: t.alias, label: t.label, kind: t.kind,
                last, change_pct: pct,
                change: last != null && pct != null ? (last * pct) / 100 : null,
                updated_at: now,
              });
            }
          }
        } catch (e) { console.warn("[tickers] coingecko failed", e); }

        if (rows.length === 0) return Response.json({ ok: false, updated: 0, v: 2 });

        const { error } = await supabaseAdmin.from("tickers").upsert(rows, { onConflict: "symbol" });
        if (error) {
          console.error("[tickers] upsert failed", error);
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const { scanPriceAlerts } = await import("@/lib/alert-scan.server");
        const alerts = await scanPriceAlerts(
          rows.map((r) => ({ alias: r.alias, label: r.label, kind: r.kind, last: r.last, change_pct: r.change_pct })),
        );

        return Response.json({ ok: true, updated: rows.length, alerts });
      },
    },
  },
});
