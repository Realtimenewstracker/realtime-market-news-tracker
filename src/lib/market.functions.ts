import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const headers = { "User-Agent": "Mozilla/5.0 (compatible; TrackIndia/1.1)", Referer: "https://www.nseindia.com/market-data" };
async function exchange<T>(path: string): Promise<T> {
  const response = await fetch(`https://www.nseindia.com/api/${path}`, { headers, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Exchange data is temporarily unavailable");
  return response.json() as Promise<T>;
}

type RawIpo = { companyName?: string; symbol?: string; issueStartDate?: string; issueEndDate?: string; issuePrice?: string; issueSize?: string; series?: string; status?: string; noOfTime?: string; category?: string };
function dateOf(value?: string) {
  if (!value || value === "-") return null;
  const match = value.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].findIndex((m) => m.toLowerCase() === match[2].toLowerCase());
  return month < 0 ? null : `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[1]}`;
}

export const getLiveIpos = createServerFn({ method: "GET" }).handler(async () => {
  const raw = await exchange<RawIpo[]>("ipo-current-issue");
  const seen = new Set<string>();
  return raw.filter((r) => {
    const key = r.symbol || r.companyName;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((r) => ({
    name: r.companyName ?? r.symbol ?? "Unnamed issue", symbol: r.symbol ?? null,
    board: r.series === "SM" ? "SME" : "Mainboard",
    openDate: dateOf(r.issueStartDate), closeDate: dateOf(r.issueEndDate),
    priceBand: r.issuePrice ?? "Not announced", issueSize: r.issueSize ?? null,
    subscription: Number.isFinite(Number(r.noOfTime)) ? Number(r.noOfTime) : null,
    status: r.status ?? "Upcoming", source: "NSE",
    url: "https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
  }));
});

type Action = { symbol?: string; comp?: string; subject?: string; exDate?: string; recDate?: string };
type Meeting = { bm_symbol?: string; bm_date?: string; bm_purpose?: string; bm_desc?: string; sm_name?: string; attachment?: string };
export const getUpcomingEvents = createServerFn({ method: "GET" }).handler(async () => {
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