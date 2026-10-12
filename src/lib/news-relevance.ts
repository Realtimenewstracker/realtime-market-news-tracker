/** Conservative eligibility check: a business-feed label alone does not make a story market news. */
const excluded = /\b(cricket|ipl|t20|test match|world cup|football|premier league|bollywood|celebrity|movie|film review|web series|recipe|horoscope|astrology|wedding|fashion|travel tips|fitness|gaming|lottery|weather forecast)\b/i;
const market = /\b(stock|share(?:s)?|equity|equities|nifty|sensex|nse|bse|sebi|rbi|reserve bank|bank|finance|financial|market|trading|investor|ipo|listing|earnings|quarterly results|profit|revenue|dividend|split|bonus issue|merger|acquisition|inflation|gdp|interest rate|repo rate|bond|yield|rupee|currency|forex|dollar|bitcoin|crypto|commodity|commodities|gold|silver|oil|crude|opec|tariff|sanction|export|import|budget|tax|policy|government|manufactur|infrastructure|contract|order book|fii|dii)\b/i;
export function isMarketRelevant(title: string, summary = "") {
  // A headline's primary subject is decisive; tangential market words in the body do not rescue sports/entertainment.
  if (excluded.test(title) && !/\b(stock|share price|sponsor|rights deal|listed company|market cap|revenue|earnings)\b/i.test(title)) return false;
  return market.test(`${title} ${summary.slice(0, 280)}`);
}