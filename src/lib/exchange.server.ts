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
