/** A publisher category alone is not enough; require a finance, macro or tagged-company signal. */
const excluded = /\b(cricket|ipl|t20|test match|world cup|football|premier league|bollywood|celebrity|movie|film review|web series|recipe|horoscope|astrology|wedding|fashion|travel tips|fitness|gaming|lottery|weather forecast)\b/i;
const directFinance = /\b(stock|stocks|share price|share prices|equity|equities|nifty|sensex|bank nifty|nse|bse|sebi|rbi|reserve bank|ipo|listing|earnings|quarterly results|profit|revenue|dividend|stock split|bonus issue|market cap|shareholder|trading|investor|fii|dii|merger|acquisition|bitcoin|crypto|commodity|commodities|gold|silver|crude oil|opec)\b/i;
const macro = /\b(inflation|gdp|interest rate|repo rate|bond yield|rupee|currency|forex|usd[inr]?|tariff|sanction|budget|tax|federal reserve|monetary policy|fomc)\b/i;
const policyOrBusiness = /\b(government|govt|cabinet|ministry|policy|regulation|scheme|manufactur\w*|infrastructure|contract|order book|export|import|energy|telecom|banking|insurance|pharma|defence|defense)\b/i;
const summaryMarket = /\b(listed company|stock market|share market|equity market|shares? (?:rose|fell|gain|drop|rally)|shareholders?|market cap|earnings|revenue|profit|order book|listed on (?:nse|bse)|securities market)\b/i;

export function isMarketRelevant(title: string, summary = "", tickers: string[] | null = null) {
  if (excluded.test(title) && !directFinance.test(title)) return false;
  if (tickers?.length) return true;
  if (directFinance.test(title) || macro.test(title)) return true;
  return policyOrBusiness.test(title) && summaryMarket.test(summary.slice(0, 280));
}
