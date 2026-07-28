
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- News articles
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  impact SMALLINT DEFAULT 0,
  sentiment TEXT,
  tickers TEXT[] NOT NULL DEFAULT '{}',
  regions TEXT[] NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX news_articles_published_idx ON public.news_articles (published_at DESC);
CREATE INDEX news_articles_category_idx ON public.news_articles (category);
CREATE INDEX news_articles_tickers_idx ON public.news_articles USING GIN (tickers);
CREATE INDEX news_articles_regions_idx ON public.news_articles USING GIN (regions);
GRANT SELECT ON public.news_articles TO anon, authenticated;
GRANT ALL ON public.news_articles TO service_role;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_public_read" ON public.news_articles FOR SELECT TO anon, authenticated USING (true);

-- Tickers (live quotes)
CREATE TABLE public.tickers (
  symbol TEXT PRIMARY KEY,
  alias TEXT NOT NULL,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'equity',
  last NUMERIC,
  change NUMERIC,
  change_pct NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tickers TO anon, authenticated;
GRANT ALL ON public.tickers TO service_role;
ALTER TABLE public.tickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickers_public_read" ON public.tickers FOR SELECT TO anon, authenticated USING (true);

-- Portfolio positions
CREATE TABLE public.portfolio_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  label TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  avg_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, symbol)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_positions TO authenticated;
GRANT ALL ON public.portfolio_positions TO service_role;
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "positions_own" ON public.portfolio_positions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Watchlist items
CREATE TABLE public.watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('symbol','keyword')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, value)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist_items TO authenticated;
GRANT ALL ON public.watchlist_items TO service_role;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlist_own" ON public.watchlist_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Hotspots (curated)
CREATE TABLE public.hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  severity SMALLINT NOT NULL DEFAULT 1,
  summary TEXT NOT NULL,
  market_impact TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hotspots TO anon, authenticated;
GRANT ALL ON public.hotspots TO service_role;
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hotspots_public_read" ON public.hotspots FOR SELECT TO anon, authenticated USING (true);

-- Seed hotspots
INSERT INTO public.hotspots (name, region, lat, lng, severity, summary, market_impact) VALUES
('Red Sea shipping disruption', 'Middle East', 15.5, 42.5, 3, 'Attacks on commercial vessels forcing reroutes around Africa.', 'Higher freight/oil prices; hits Indian exporters and refiners.'),
('Israel–Gaza conflict', 'Middle East', 31.5, 34.5, 3, 'Ongoing conflict with regional escalation risk.', 'Oil volatility; safe-haven flows to gold, USD.'),
('Russia–Ukraine war', 'Europe', 49.0, 32.0, 3, 'Prolonged war; sanctions and energy realignment.', 'Wheat, fertilizer, and crude supply risks for India.'),
('US–China tech decoupling', 'Asia-Pacific', 35.9, 104.1, 2, 'Chip export controls and tariff escalation.', 'Global tech supply chain shifts; India semis benefit.'),
('Taiwan Strait tensions', 'Asia-Pacific', 23.7, 121.0, 2, 'Chinese military drills near Taiwan.', 'Semiconductor supply risk; Nifty IT sensitivity.'),
('Iran nuclear talks', 'Middle East', 32.0, 53.0, 2, 'Sanctions and diplomatic flux.', 'Direct oil price and INR impact.'),
('US Fed policy path', 'North America', 38.9, -77.0, 2, 'Rate trajectory drives global risk appetite.', 'FII flows into Indian equities and bonds.'),
('India–China LAC standoff', 'Asia-Pacific', 34.15, 78.0, 2, 'Border tensions along the Line of Actual Control.', 'Defence, infra stocks reactive.');

-- Seed default tickers row set (values fill on first refresh)
INSERT INTO public.tickers (symbol, alias, label, kind) VALUES
('^NSEI','NIFTY','NIFTY 50','index'),
('^BSESN','SENSEX','SENSEX','index'),
('^NSEBANK','BANKNIFTY','BANK NIFTY','index'),
('^CNXIT','NIFTYIT','NIFTY IT','index'),
('INR=X','USDINR','USD/INR','fx'),
('RELIANCE.NS','RELIANCE','RELIANCE','equity'),
('TCS.NS','TCS','TCS','equity'),
('HDFCBANK.NS','HDFCBANK','HDFC BANK','equity'),
('INFY.NS','INFY','INFOSYS','equity'),
('BTC-USD','BTC','BITCOIN','crypto'),
('ETH-USD','ETH','ETHEREUM','crypto'),
('GC=F','GOLD','GOLD','commodity'),
('CL=F','WTI','WTI CRUDE','commodity');
