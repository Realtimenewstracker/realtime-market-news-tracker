import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getLiveIpos = createServerFn({ method: "GET" }).handler(async () => {
  const { loadLiveIpos } = await import("@/lib/exchange.server");
  return loadLiveIpos();
});

type Action = { symbol?: string; comp?: string; subject?: string; exDate?: string; recDate?: string };
type Meeting = { bm_symbol?: string; bm_date?: string; bm_purpose?: string; bm_desc?: string; sm_name?: string; attachment?: string };
export const getUpcomingEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { exchange, dateOf } = await import("@/lib/exchange.server");
  const [actions, meetings] = await Promise.all([
    exchange<Action[]>("corporates-corporateActions?index=equities"),
    exchange<Meeting[]>("corporate-board-meetings?index=equities"),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  return [
    ...actions.map((a) => ({ symbol: a.symbol ?? "—", company: a.comp ?? a.symbol ?? "Company", date: dateOf(a.exDate), kind: /dividend/i.test(a.subject ?? "") ? "Dividend" : /bonus/i.test(a.subject ?? "") ? "Bonus" : /split|sub-division/i.test(a.subject ?? "") ? "Split" : "Corporate action", detail: a.subject ?? "Corporate action", url: "https://www.nseindia.com/companies-listing/corporate-filings-actions" })),
    ...meetings.map((m) => ({ symbol: m.bm_symbol ?? "—", company: m.sm_name ?? m.bm_symbol ?? "Company", date: dateOf(m.bm_date), kind: /result|financial/i.test(m.bm_desc ?? "") ? "Results" : "Board meeting", detail: m.bm_desc ?? m.bm_purpose ?? "Board meeting", url: m.attachment?.startsWith("https://nsearchives.nseindia.com/") ? m.attachment : "https://www.nseindia.com/companies-listing/corporate-filings-board-meetings" })),
  ].filter((e) => e.date && e.date >= today).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")).slice(0, 80);
});

const symbolSchema = z.object({ symbol: z.string().regex(/^[A-Z0-9^=.\-]{1,24}$/) });
type Chart = { chart?: { result?: Array<{ meta?: { shortName?: string; longName?: string; regularMarketPrice?: number; previousClose?: number; regularMarketVolume?: number; currency?: string; fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number }; timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };
export const getMarketQuote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => symbolSchema.parse(input))
  .handler(async ({ data }) => {
    const { headers } = await import("@/lib/exchange.server");
    const symbol = data.symbol.startsWith("^") || data.symbol.includes("=") || data.symbol.endsWith("-USD") ? data.symbol : `${data.symbol.replace(/\.NS$/, "")}.NS`;
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`, { headers, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Quote unavailable for this symbol");
    const chart = (await response.json() as Chart).chart?.result?.[0];
    if (!chart?.meta) throw new Error("Quote unavailable for this symbol");
    return { symbol: data.symbol, name: chart.meta.longName ?? chart.meta.shortName ?? data.symbol,
      last: chart.meta.regularMarketPrice ?? null, previous: chart.meta.previousClose ?? null,
      volume: chart.meta.regularMarketVolume ?? null, currency: chart.meta.currency ?? "INR",
      high52: chart.meta.fiftyTwoWeekHigh ?? null, low52: chart.meta.fiftyTwoWeekLow ?? null,
      points: (chart.timestamp ?? []).map((at, i) => ({ at, close: chart.indicators?.quote?.[0]?.close?.[i] ?? null })).filter((p) => p.close != null),
      source: "Yahoo Finance" };
  });
export const getIpoSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ symbol: z.string().max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const { loadLiveIpos } = await import("@/lib/exchange.server");
    const result = await loadLiveIpos();
    const ipo = result.issues.find((item) => (item.symbol ?? item.name) === data.symbol);
    if (!ipo) throw new Error("This IPO is no longer reported by the exchange. Refresh the list.");
    const { summarizeIpo } = await import("@/lib/ipo-ai/summary.server");
    return summarizeIpo(ipo, context.supabase);
  });
