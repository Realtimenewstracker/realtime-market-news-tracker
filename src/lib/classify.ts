/**
 * Rule-based sentiment + impact classifier.
 * Used as an immediate fallback whenever AI enrichment is unavailable
 * (rate limits, missing key) so the feed never degrades to "neutral / low".
 */

const BULLISH =
  /\b(surge[sd]?|jump[sd]?|rally|rallie[sd]|soar[sd]?|gain[sd]?|climb[sd]?|rise[sn]?|rose|up\s?\d|record high|all-?time high|beat[s]? estimates|profit rise|upgrade[sd]?|outperform|inflow[s]?|buyback|bullish|boost[sd]?|expand[sd]?|approval|approved|wins?|awarded|order win|hikes? guidance|strong demand|recover[syd]+)\b/i;

const BEARISH =
  /\b(fall[s]?|fell|drop[sd]?|slump[sd]?|plunge[sd]?|crash(?:e[sd])?|tumble[sd]?|slide[sd]?|decline[sd]?|loss(?:es)?|miss(?:e[sd])? estimates|downgrade[sd]?|underperform|outflow[s]?|bearish|cut[s]? guidance|layoff[s]?|job cuts|probe|investigation|fraud|scam|default|ban(?:ned|s)?|penalt(?:y|ies)|fine[sd]?|sell-?off|weak demand|warn(?:s|ing|ed)?|recession|slowdown|strike[s]?|attack[s]?|war|sanction[s]?|tariff[s]?)\b/i;

const HIGH_IMPACT =
  /\b(rbi|reserve bank|federal reserve|\bfed\b|fomc|repo rate|interest rate|rate (?:cut|hike|decision)|inflation|cpi|wpi|gdp|budget|monetary policy|crude|opec|tariff[s]?|war|invasion|sanction[s]?|default|circuit breaker|crash|record high|all-?time high|sebi|ipo|merger|acquisition|results|earnings|guidance|downgrade|upgrade|election)\b/i;

const MED_IMPACT =
  /\b(nifty|sensex|bank nifty|dollar|rupee|bond yield|fii|dii|oil price[s]?|gold|bitcoin|stake|order win|contract|dividend|bonus issue|stock split|q[1-4] (?:results|profit))\b/i;

export type Mood = "bullish" | "bearish" | "neutral";

export function classifyText(title: string, body = ""): { sentiment: Mood; impact: number } {
  const text = `${title} ${body}`;
  const head = title;

  const bull = (BULLISH.test(head) ? 2 : 0) + (BULLISH.test(text) ? 1 : 0);
  const bear = (BEARISH.test(head) ? 2 : 0) + (BEARISH.test(text) ? 1 : 0);
  const sentiment: Mood = bull === bear ? "neutral" : bull > bear ? "bullish" : "bearish";

  let impact = 1;
  if (MED_IMPACT.test(text)) impact = 2;
  if (HIGH_IMPACT.test(text)) impact = 3;

  // Big percentage moves or big money figures push impact up.
  const pct = text.match(/(\d+(?:\.\d+)?)\s?%/);
  if (pct && Number(pct[1]) >= 3) impact = Math.max(impact, 3);
  if (/\b(billion|crore|lakh crore|trillion)\b/i.test(text)) impact = Math.max(impact, 2);

  // Pure noise headlines stay low.
  if (sentiment === "neutral" && impact === 1) impact = 1;

  return { sentiment, impact: Math.max(0, Math.min(3, impact)) };
}
