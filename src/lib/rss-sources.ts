export type RssSource = { name: string; category: string; url: string };

export const RSS_SOURCES: RssSource[] = [
  { name: "Moneycontrol Markets", category: "stocks", url: "https://www.moneycontrol.com/rss/marketreports.xml" },
  { name: "Moneycontrol Business", category: "stocks", url: "https://www.moneycontrol.com/rss/business.xml" },
  { name: "Moneycontrol Latest", category: "stocks", url: "https://www.moneycontrol.com/rss/latestnews.xml" },
  { name: "ET Markets", category: "stocks", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms" },
  { name: "ET Economy", category: "macro", url: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms" },
  { name: "Business Standard", category: "stocks", url: "https://www.business-standard.com/rss/markets-106.rss" },
  { name: "Business Standard Econ", category: "macro", url: "https://www.business-standard.com/rss/economy-102.rss" },
  { name: "Livemint Markets", category: "stocks", url: "https://www.livemint.com/rss/markets" },
  { name: "Livemint Money", category: "macro", url: "https://www.livemint.com/rss/money" },
  { name: "NDTV Profit", category: "stocks", url: "https://feeds.feedburner.com/ndtvprofit-latest" },
  { name: "OilPrice", category: "commodities", url: "https://oilprice.com/rss/main" },
  { name: "CoinDesk", category: "crypto", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
];

export const TICKER_SYMBOLS = {
  yahoo: [
    { symbol: "^NSEI", alias: "NIFTY", label: "NIFTY 50", kind: "index" },
    { symbol: "^BSESN", alias: "SENSEX", label: "SENSEX", kind: "index" },
    { symbol: "^NSEBANK", alias: "BANKNIFTY", label: "BANK NIFTY", kind: "index" },
    { symbol: "^CNXIT", alias: "NIFTYIT", label: "NIFTY IT", kind: "index" },
    { symbol: "INR=X", alias: "USDINR", label: "USD/INR", kind: "fx" },
    { symbol: "RELIANCE.NS", alias: "RELIANCE", label: "RELIANCE", kind: "equity" },
    { symbol: "TCS.NS", alias: "TCS", label: "TCS", kind: "equity" },
    { symbol: "HDFCBANK.NS", alias: "HDFCBANK", label: "HDFC BANK", kind: "equity" },
    { symbol: "INFY.NS", alias: "INFY", label: "INFOSYS", kind: "equity" },
    { symbol: "GC=F", alias: "GOLD", label: "GOLD", kind: "commodity" },
    { symbol: "CL=F", alias: "WTI", label: "WTI CRUDE", kind: "commodity" },
  ],
  coingecko: [
    { symbol: "BTC-USD", coingecko: "bitcoin", alias: "BTC", label: "BITCOIN", kind: "crypto" },
    { symbol: "ETH-USD", coingecko: "ethereum", alias: "ETH", label: "ETHEREUM", kind: "crypto" },
  ],
};
