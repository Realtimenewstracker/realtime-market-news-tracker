import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getLiveIpos = createServerFn({ method: "GET" }).handler(async () => {
  const { loadLiveIpos } = await import("@/lib/exchange.server");
  return loadLiveIpos();
});

export const getUpcomingEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { loadUpcomingEvents } = await import("@/lib/exchange.server");
  return loadUpcomingEvents();
});

const symbolSchema = z.object({ symbol: z.string().regex(/^[A-Z0-9^=.\-]{1,24}$/), range: z.enum(["1mo", "3mo", "6mo", "1y", "5y"]).default("1mo") });
type Chart = { chart?: { result?: Array<{ meta?: { shortName?: string; longName?: string; regularMarketPrice?: number; regularMarketTime?: number; previousClose?: number; regularMarketVolume?: number; currency?: string; fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number }; timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };
export const getMarketQuote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => symbolSchema.parse(input))
  .handler(async ({ data }) => {
    const { headers } = await import("@/lib/exchange.server");
    const symbol = data.symbol.startsWith("^") || data.symbol.includes("=") || data.symbol.endsWith("-USD") ? data.symbol : `${data.symbol.replace(/\.NS$/, "")}.NS`;
    const interval = data.range === "5y" ? "1wk" : "1d";
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${data.range}&interval=${interval}`, { headers, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Quote unavailable for this symbol");
    const chart = (await response.json() as Chart).chart?.result?.[0];
    if (!chart?.meta) throw new Error("Quote unavailable for this symbol");
    return { symbol: data.symbol, name: chart.meta.longName ?? chart.meta.shortName ?? data.symbol,
      last: chart.meta.regularMarketPrice ?? null, previous: chart.meta.previousClose ?? null,
      updatedAt: chart.meta.regularMarketTime ?? chart.timestamp?.at(-1) ?? null,
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
