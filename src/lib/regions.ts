export const REGIONS = ["India", "US", "China", "Europe", "Middle East", "Global"] as const;
export type Region = (typeof REGIONS)[number];

const PATTERNS: Record<Region, RegExp> = {
  India:
    /\b(india|indian|nse|bse|sensex|nifty|rbi|sebi|rupee|inr|mumbai|delhi|modi|gst|dalal street|fii|dii)\b/i,
  US: /\b(u\.?s\.?a?|united states|america|american|fed|federal reserve|nasdaq|dow jones|s&p 500|wall street|treasury yields|trump|powell)\b/i,
  China: /\b(china|chinese|beijing|shanghai|yuan|renminbi|pboc|hong kong)\b/i,
  Europe: /\b(europe|european|eu|ecb|euro zone|eurozone|germany|france|uk|britain|london|euro)\b/i,
  "Middle East": /\b(middle east|gulf|opec|saudi|uae|dubai|qatar|iran|israel|red sea)\b/i,
  Global: /\b(global|world|imf|world bank|worldwide|international|geopolit)\b/i,
};

const INDIAN_TICKER = /^[A-Z&-]{2,15}$/;

/** Region tags for an article: stored regions when present, else derived from text. */
export function articleRegions(a: {
  title?: string | null;
  summary?: string | null;
  ai_summary?: string | null;
  regions?: string[] | null;
  tickers?: string[] | null;
  category?: string | null;
}): string[] {
  const stored = (a.regions ?? []).filter(Boolean);
  if (stored.length) return stored;

  const text = `${a.title ?? ""} ${a.ai_summary ?? ""} ${a.summary ?? ""}`;
  const out = new Set<string>();
  for (const r of REGIONS) if (PATTERNS[r].test(text)) out.add(r);
  if ((a.tickers ?? []).some((t) => INDIAN_TICKER.test(t))) out.add("India");
  if (out.size === 0) out.add("Global");
  return [...out];
}

export function matchesRegion(article: Parameters<typeof articleRegions>[0], region: string): boolean {
  if (!region || region === "all") return true;
  return articleRegions(article).includes(region);
}
