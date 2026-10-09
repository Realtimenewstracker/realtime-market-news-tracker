const headers = { "User-Agent": "Mozilla/5.0 (compatible; TrackIndia/1.1)", Referer: "https://www.nseindia.com/market-data" };
async function exchange<T>(path: string): Promise<T> {
  const response = await fetch(`https://www.nseindia.com/api/${path}`, { headers, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Exchange data is temporarily unavailable");
  return response.json() as Promise<T>;
}

export type RawIpo = { companyName?: string; symbol?: string; issueStartDate?: string; issueEndDate?: string; issuePrice?: string; issueSize?: string; series?: string; status?: string; noOfTime?: string; category?: string };
function dateOf(value?: string) {
  if (!value || value === "-") return null;
  const match = value.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].findIndex((m) => m.toLowerCase() === match[2].toLowerCase());
  return month < 0 ? null : `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[1]}`;
}

export async function loadLiveIpos() {
  const results = await Promise.allSettled([
    exchange<RawIpo[]>("ipo-current-issue"),
    exchange<RawIpo[]>("all-upcoming-issues?category=ipo"),
  ]);
  if (results.every((r) => r.status === "rejected")) throw new Error("Exchange IPO data is temporarily unavailable");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const seen = new Set<string>();
  const issues = results.flatMap((r) => r.status === "fulfilled" && Array.isArray(r.value) ? r.value : []).filter((r) => {
    const key = r.symbol || r.companyName;
    if (!key || seen.has(key) || r.series === "DEBT") return false;
    seen.add(key); return true;
  }).map((r) => {
    const openDate = dateOf(r.issueStartDate), closeDate = dateOf(r.issueEndDate);
    const status = openDate && openDate > today ? "Upcoming" : closeDate && closeDate < today ? "Closed" : "Open";
    return { name: r.companyName ?? r.symbol ?? "Unnamed issue", symbol: r.symbol ?? null,
      board: r.series === "SM" ? "SME" : "Mainboard", openDate, closeDate,
      priceBand: r.issuePrice && r.issuePrice !== "-" ? r.issuePrice : "Not announced",
      offeredShares: r.issueSize ?? null,
      subscription: r.noOfTime && Number.isFinite(Number(r.noOfTime)) ? Number(r.noOfTime) : null,
      status, source: "NSE", url: "https://www.nseindia.com/market-data/all-upcoming-issues-ipo" };
  });
  return { issues: issues.sort((a,b) => (a.openDate ?? "9999").localeCompare(b.openDate ?? "9999")),
    upcomingAvailable: results[1].status === "fulfilled", checkedAt: new Date().toISOString() };
}
export { exchange, dateOf, headers };

type Action = { symbol?: string; comp?: string; subject?: string; exDate?: string; recDate?: string };
type Meeting = { bm_symbol?: string; bm_date?: string; bm_purpose?: string; bm_desc?: string; sm_name?: string; attachment?: string };
export async function loadUpcomingEvents() {
  const [actions, meetings] = await Promise.all([
    exchange<Action[]>("corporates-corporateActions?index=equities"),
    exchange<Meeting[]>("corporate-board-meetings?index=equities"),
  ]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const candidates = [
    ...actions.map((a) => ({ symbol: a.symbol ?? "—", company: a.comp ?? a.symbol ?? "Company", date: dateOf(a.exDate), kind: /dividend/i.test(a.subject ?? "") ? "Dividend" : /bonus/i.test(a.subject ?? "") ? "Bonus" : /split|sub-division/i.test(a.subject ?? "") ? "Split" : "Corporate action", detail: a.subject ?? "Corporate action", url: "https://www.nseindia.com/companies-listing/corporate-filings-actions" })),
    ...meetings.map((m) => ({ symbol: m.bm_symbol ?? "—", company: m.sm_name ?? m.bm_symbol ?? "Company", date: dateOf(m.bm_date), kind: /result|financial/i.test(m.bm_desc ?? "") ? "Results" : "Board meeting", detail: m.bm_desc ?? m.bm_purpose ?? "Board meeting", url: m.attachment?.startsWith("https://nsearchives.nseindia.com/") ? m.attachment : "https://www.nseindia.com/companies-listing/corporate-filings-board-meetings" })),
  ].filter((event) => event.date && event.date >= today);
  const unique = new Map<string, (typeof candidates)[number]>();
  for (const event of candidates) {
    const eventIdentity = event.symbol === "—" ? event.detail.toLowerCase() : event.symbol.toUpperCase();
    const key = `${eventIdentity}|${event.date}|${event.kind}`;
    const current = unique.get(key);
    if (!current) {
      unique.set(key, event);
      continue;
    }
    const eventHasOfficialAttachment = event.url.startsWith("https://nsearchives.nseindia.gov.in/");
    const currentHasOfficialAttachment = current.url.startsWith("https://nsearchives.nseindia.gov.in/");
    if ((eventHasOfficialAttachment && !currentHasOfficialAttachment) || event.detail.length > current.detail.length) {
      unique.set(key, { ...event, url: eventHasOfficialAttachment ? event.url : current.url });
    }
  }
  return [...unique.values()].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")).slice(0, 80);
}

